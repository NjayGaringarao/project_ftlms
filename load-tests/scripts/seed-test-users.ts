import type { SupabaseClient } from "@supabase/supabase-js";
import type { PersonaKey } from "./lib/env";
import { createSupabaseAdmin } from "./lib/supabase-admin";
import { pickOrLoadScope } from "./lib/scope";
import { writeState } from "./lib/state";
import { loadCsvUsers, type CsvUserRow } from "./lib/csv-users";
import { classifyDesignation } from "./lib/designation-parser";
import { resolveCampusIdByName, resolveCollegeIdByCode, resolveProgramOfferingId } from "./lib/academic-lookup";

type PersonaResult = {
  userId: string;
  designationId: string;
  email: string;
  password: string;
};

type SeededRow = {
  email: string;
  password: string;
  userId: string;
  designationId: string | null;
  jobTitle: string | null;
  campusName: string;
  programCode: string | null;
};

const findUserByEmail = async (admin: SupabaseClient, email: string) => {
  // No direct getUserByEmail in supabase-js admin API — page through listUsers.
  // Local dev DBs are small, so a single large page is enough.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return (
    data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null
  );
};

const ensureAuthUser = async (
  admin: SupabaseClient,
  row: CsvUserRow,
): Promise<{ id: string; createdNow: boolean }> => {
  const existing = await findUserByEmail(admin, row.email);
  if (existing) {
    if (row.role === "ADMIN" && existing.user_metadata?.user_role !== "ADMIN") {
      const { error } = await admin.auth.admin.updateUserById(existing.id, {
        user_metadata: { ...existing.user_metadata, user_role: "ADMIN" },
      });
      if (error) throw error;
    }
    return { id: existing.id, createdNow: false };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: row.email,
    password: row.password,
    email_confirm: true,
    user_metadata: row.role === "ADMIN" ? { user_role: "ADMIN" } : undefined,
  });
  if (error) throw error;
  if (!data.user) throw new Error(`createUser returned no user for ${row.email}`);
  return { id: data.user.id, createdNow: true };
};

const ensureUserProfile = async (
  admin: SupabaseClient,
  userId: string,
  campusId: string,
  collegeId: string,
) => {
  const { error } = await admin
    .from("user")
    .update({ employment_status: "Regular", campus_id: campusId, college_id: collegeId })
    .eq("id", userId);
  if (error) throw error;
};

const ensureIdentity = async (admin: SupabaseClient, userId: string, row: CsvUserRow) => {
  const { error } = await admin.from("identity").upsert(
    {
      user_id: userId,
      first_name: row.firstName || null,
      middle_name: row.middleName || null,
      last_name: row.lastName || null,
      suffix: row.suffix || null,
      professional_extension: row.professionalExtension || null,
      address: row.address || null,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
};

const ensureDesignation = async (
  admin: SupabaseClient,
  email: string,
  userId: string,
  jobTitle: string,
  matcher: Record<string, string>,
  insertExtra: Record<string, string>,
): Promise<string> => {
  const { data: existing, error: lookupError } = await admin
    .from("designation")
    .select("id, user_id")
    .match(matcher)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (existing) {
    if (existing.user_id !== userId) {
      throw new Error(
        `A "${jobTitle}" designation matching ${JSON.stringify(matcher)} already exists for a ` +
          `different user (designation.user_id=${existing.user_id}), but base_users.csv assigns it ` +
          `to ${email} (user.id=${userId}). Reset the local DB (npx supabase db reset) and rerun, ` +
          "or fix base_users.csv.",
      );
    }
    return existing.id;
  }

  const { data: inserted, error: insertError } = await admin
    .from("designation")
    .insert({ user_id: userId, job_title: jobTitle, ...insertExtra })
    .select("id")
    .single();
  if (insertError) throw insertError;
  return inserted.id;
};

const seedRow = async (admin: SupabaseClient, row: CsvUserRow): Promise<SeededRow> => {
  const { id: userId, createdNow } = await ensureAuthUser(admin, row);
  const campusId = await resolveCampusIdByName(admin, row.campusName);
  const collegeId = await resolveCollegeIdByCode(admin, row.collegeCode);
  await ensureUserProfile(admin, userId, campusId, collegeId);
  await ensureIdentity(admin, userId, row);

  const classification = classifyDesignation(row.designation);
  let designationId: string | null = null;
  let programCode: string | null = null;
  let jobTitle: string | null = null;

  if (classification.kind === "program-chair") {
    programCode = classification.programCode;
    jobTitle = classification.jobTitle;
    const { programOfferingId } = await resolveProgramOfferingId(admin, campusId, programCode);
    designationId = await ensureDesignation(
      admin,
      row.email,
      userId,
      jobTitle,
      { job_title: jobTitle, program_offering_id: programOfferingId },
      { program_offering_id: programOfferingId },
    );
  } else if (classification.kind === "campus-scoped") {
    jobTitle = classification.jobTitle;
    designationId = await ensureDesignation(
      admin,
      row.email,
      userId,
      jobTitle,
      { job_title: jobTitle, campus_id: campusId },
      { campus_id: campusId },
    );
  } else if (classification.kind === "global") {
    jobTitle = classification.jobTitle;
    designationId = await ensureDesignation(
      admin,
      row.email,
      userId,
      jobTitle,
      { job_title: jobTitle },
      {},
    );
  }

  console.log(
    `[${row.role}] ${row.email} -> user ${userId} (${createdNow ? "created" : "existing"})` +
      (jobTitle ? `, designation "${jobTitle}" -> ${designationId}` : ", no designation"),
  );

  return {
    email: row.email,
    password: row.password,
    userId,
    designationId,
    jobTitle,
    campusName: row.campusName,
    programCode,
  };
};

// The k6 scripts drive the campus-college-load workflow (Program Chair ->
// Campus Director -> Director for Instruction -> VP for Academic Affairs)
// and need exactly one real user per step. These predicates pick them out of
// whatever base_users.csv seeded — see load-tests/README.md for why
// Castillejos/BSCS specifically backs the "chair" role.
const REQUIRED_ROLES: Record<PersonaKey, (row: SeededRow) => boolean> = {
  chair: (row) =>
    row.jobTitle === "Program Chairperson" &&
    row.campusName.toUpperCase() === "CASTILLEJOS" &&
    row.programCode === "BSCS",
  campusDirector: (row) =>
    row.jobTitle === "Campus Director" && row.campusName.toUpperCase() === "CASTILLEJOS",
  dfi: (row) => row.jobTitle === "Director for Instruction",
  vpaa: (row) => row.jobTitle === "Vice President for Academic Affairs",
};

const derivePersonas = (rows: SeededRow[]): Record<PersonaKey, PersonaResult> => {
  const result = {} as Record<PersonaKey, PersonaResult>;
  for (const key of Object.keys(REQUIRED_ROLES) as PersonaKey[]) {
    const match = rows.find(REQUIRED_ROLES[key]);
    if (!match || !match.designationId) {
      throw new Error(
        `base_users.csv has no row satisfying the required "${key}" role (see REQUIRED_ROLES in ` +
          "seed-test-users.ts). The campus-college-load k6 scripts need exactly one Program " +
          "Chairperson at Castillejos/BSCS, one Campus Director at Castillejos, one Director for " +
          "Instruction, and one Vice President for Academic Affairs.",
      );
    }
    result[key] = {
      userId: match.userId,
      designationId: match.designationId,
      email: match.email,
      password: match.password,
    };
  }
  return result;
};

const main = async () => {
  const admin = createSupabaseAdmin();
  const rows = loadCsvUsers();
  await pickOrLoadScope(admin);

  const seeded: SeededRow[] = [];
  for (const row of rows) {
    seeded.push(await seedRow(admin, row));
  }

  const personas = derivePersonas(seeded);
  writeState("personas.json", personas);
  writeState(
    "users.json",
    seeded.map(({ password: _password, ...rest }) => rest),
  );
  console.log(
    `Seed complete. Seeded ${seeded.length} user(s) from base_users.csv. Wrote .state/personas.json.`,
  );
};

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
