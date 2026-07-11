import type { SupabaseClient } from "@supabase/supabase-js";
import { readState, writeState } from "./state";
import { resolveCampusIdByName, resolveProgramOfferingId } from "./academic-lookup";

export type SeedScope = {
  sectionId: string;
  academicTermId: string;
  programOfferingId: string;
  campusId: string;
  collegeId: string;
  batchTermIds?: string[];
  batchAcademicYearIds?: string[];
};

const STATE_FILE = "seed-scope.json";

// Matches the "chair" persona from base_users.csv (Program Chairperson,
// Castillejos/BSCS — see load-tests/scripts/seed-test-users.ts) so the
// scheduler/campus-college-load scopes actually line up with a real seeded
// user's designation instead of an arbitrary offering.
const CHAIR_CAMPUS_NAME = "Castillejos";
const CHAIR_PROGRAM_CODE = "BSCS";

const pickScope = async (admin: SupabaseClient): Promise<SeedScope> => {
  const campusId = await resolveCampusIdByName(admin, CHAIR_CAMPUS_NAME);
  const { programOfferingId, collegeId } = await resolveProgramOfferingId(
    admin,
    campusId,
    CHAIR_PROGRAM_CODE,
  );

  const { data: majorOfferings, error: majorOfferingError } = await admin
    .from("major_offering")
    .select("id")
    .eq("program_offering_id", programOfferingId);
  if (majorOfferingError) throw majorOfferingError;
  const majorOfferingIds = (majorOfferings ?? []).map((row) => row.id);
  if (majorOfferingIds.length === 0) {
    throw new Error(
      `No major_offering rows found for ${CHAIR_CAMPUS_NAME}/${CHAIR_PROGRAM_CODE}'s program_offering. ` +
        "Check supabase/seeds/1007_major_offerings.sql.",
    );
  }

  const { data: section, error: sectionError } = await admin
    .from("section")
    .select("id, academic_term_id")
    .in("major_offering_id", majorOfferingIds)
    .limit(1)
    .maybeSingle();
  if (sectionError) throw sectionError;
  if (!section) {
    throw new Error(
      `No section rows found for ${CHAIR_CAMPUS_NAME}/${CHAIR_PROGRAM_CODE}. ` +
        "Check supabase/seeds/1010_sections.sql.",
    );
  }

  return {
    sectionId: section.id,
    academicTermId: section.academic_term_id,
    programOfferingId,
    campusId,
    collegeId,
  };
};

export const pickOrLoadScope = async (admin: SupabaseClient): Promise<SeedScope> => {
  const existing = readState<SeedScope>(STATE_FILE);
  if (existing) return existing;

  const scope = await pickScope(admin);
  writeState(STATE_FILE, scope);
  return scope;
};

export const loadScopeOrThrow = (): SeedScope => {
  const existing = readState<SeedScope>(STATE_FILE);
  if (!existing) {
    throw new Error(
      "No .state/seed-scope.json found. Run `npm run seed` first to pick a test scope.",
    );
  }
  return existing;
};

export const saveScope = (scope: SeedScope): void => {
  writeState(STATE_FILE, scope);
};
