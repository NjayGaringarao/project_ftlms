"use server";

import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { Identity } from "@/models/identity";
import { ExtendedDesignation } from "@/models/designation";
import { Degree } from "@/models/degree";
import { AcademicRank } from "@/models/academic_rank";
import { User } from "@/models/user";

export type IdentityUpdateInput = {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  extension?: string | null;
  birth_date: string;
  address?: string | null;
  zip_code?: string | null;
  contact_number?: string | null;
};

export const getIdentityByUserId = async (
  userId: string,
): Promise<Identity | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("identity")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("lib.me.profile.getIdentityByUserId ::", error);
    return null;
  }

  return data as Identity;
};

export async function getIdentityForCurrentUser(): Promise<Identity | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return getIdentityByUserId(user.id);
}

export async function upsertIdentityForCurrentUser(
  input: IdentityUpdateInput,
): Promise<{ data?: Identity; error?: string }> {
  const user = await getCurrentUser();

  if (!user) return { error: "Not authenticated" };

  if (!input.first_name?.trim()) return { error: "First name is required" };

  if (!input.last_name?.trim()) return { error: "Last name is required" };

  if (!input.birth_date?.trim()) return { error: "Birth date is required" };

  const supabase = await createClient();

  const payload: Identity = {
    user_id: user.id,
    first_name: input.first_name.trim(),
    middle_name: input.middle_name ?? null,
    last_name: input.last_name.trim(),
    extension: input.extension ?? null,
    birth_date: input.birth_date,
    address: input.address ?? null,
    zip_code: input.zip_code ?? null,
    contact_number: input.contact_number ?? null,
  };

  const { data, error } = await supabase
    .from("identity")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: data as Identity };
}

export type ProfessionalInfo = {
  user: User | null;
  rank: AcademicRank | null;
  designations: ProfessionalDesignation[];
};

export type ProfessionalDesignation = Omit<ExtendedDesignation, "user">;

type DesignationRow = {
  id: string;
  user_id: string;
  campus_id: string | null;
  college_id: string | null;
  program_offering_id: string | null;
  room_id: string | null;
  job_title: string;
  load: number | null;
  designated_at: string;
  campus:
    | ProfessionalDesignation["campus"]
    | ProfessionalDesignation["campus"][]
    | null;
  college:
    | ProfessionalDesignation["college"]
    | ProfessionalDesignation["college"][]
    | null;
  program_offering:
    | (ProfessionalDesignation["program_offering"] & {
        campus?:
          | ProfessionalDesignation["campus"]
          | ProfessionalDesignation["campus"][]
          | null;
        program?:
          | ProfessionalDesignation["program"]
          | ProfessionalDesignation["program"][]
          | null;
      })
    | Array<
        ProfessionalDesignation["program_offering"] & {
          campus?:
            | ProfessionalDesignation["campus"]
            | ProfessionalDesignation["campus"][]
            | null;
          program?:
            | ProfessionalDesignation["program"]
            | ProfessionalDesignation["program"][]
            | null;
        }
      >
    | null;
};

export const getProfessionalInfoByUserId = async (
  userId: string,
): Promise<ProfessionalInfo> => {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase
    .from("user")
    .select(
      "id, academic_rank_id, employment_status, academic_rank ( id, number, title, description )",
    )
    .eq("id", userId)
    .single();

  if (userError && userError.code !== "PGRST116") {
    console.error(
      "lib.me.profile.getProfessionalInfoByUserId.user ::",
      userError,
    );
  }

  const user: User | null = userData
    ? {
        id: userData.id,
        academic_rank_id: userData.academic_rank_id,
        employment_status: userData.employment_status,
      }
    : null;

  const rank: AcademicRank | null = userData?.academic_rank
    ? Array.isArray(userData.academic_rank)
      ? (userData.academic_rank[0] as AcademicRank)
      : (userData.academic_rank as AcademicRank)
    : null;

  const { data: designationData, error: designationError } = await supabase
    .from("designation")
    .select(
      "id, user_id, campus_id, college_id, program_offering_id, room_id, job_title, load, designated_at, campus ( id, name, address, zip_code ), college:college_id ( id, code, name, description ), program_offering:program_offering_id ( id, campus_id, program_id, campus:campus_id ( id, name, address, zip_code ), program:program_id ( id, college_id, code, name, description, college:college_id ( id, code, name, description ) ) )",
    )
    .eq("user_id", userId)
    .order("job_title", { ascending: true });

  if (designationError) {
    console.error(
      "lib.me.profile.getProfessionalInfoByUserId.designations ::",
      designationError,
    );
  }

  const designations: ProfessionalDesignation[] = (designationData ?? []).map(
    (raw) => {
      const d = raw as DesignationRow;

      const programOffering = Array.isArray(d.program_offering)
        ? (d.program_offering[0] ?? null)
        : d.program_offering;
      const program = Array.isArray(programOffering?.program)
        ? (programOffering.program[0] ?? null)
        : (programOffering?.program ?? null);
      const campusFromOffering = Array.isArray(programOffering?.campus)
        ? (programOffering.campus[0] ?? null)
        : (programOffering?.campus ?? null);
      const directCampus = Array.isArray(d.campus)
        ? (d.campus[0] ?? null)
        : d.campus;
      const college = Array.isArray(d.college)
        ? (d.college[0] ?? null)
        : d.college;

      return {
        id: d.id,
        user_id: d.user_id,
        campus_id: d.campus_id,
        college_id: d.college_id,
        program_offering_id: d.program_offering_id,
        room_id: d.room_id,
        job_title: d.job_title,
        load: d.load,
        designated_at: d.designated_at,
        position: d.job_title,
        campus: directCampus ?? campusFromOffering,
        college,
        program,
        program_offering: programOffering,
      };
    },
  );

  return {
    user,
    rank,
    designations,
  };
};

export async function getProfessionalInfoForCurrentUser(): Promise<ProfessionalInfo> {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, rank: null, designations: [] };
  }

  return getProfessionalInfoByUserId(user.id);
}

export type DegreeInput = {
  id?: string;
  academic_level: string;
  degree_type: string;
  field_of_study: string;
  institution: string;
  country_code: string;
  year_graduated: number | null;
};

export const getDegreesByUserId = async (userId: string): Promise<Degree[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("degree")
    .select("*")
    .eq("user_id", userId)
    .order("year_graduated", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("lib.me.profile.getDegreesByUserId ::", error);
    return [];
  }

  return (data ?? []) as Degree[];
};

export async function saveDegreesForCurrentUser(
  degrees: DegreeInput[],
): Promise<{ data?: Degree[]; error?: string }> {
  const user = await getCurrentUser();

  if (!user) return { error: "Not authenticated" };

  for (const [index, degree] of degrees.entries()) {
    if (!degree.academic_level?.trim()) {
      return { error: `Academic level is required (row ${index + 1})` };
    }
    if (!degree.degree_type?.trim()) {
      return { error: `Degree type is required (row ${index + 1})` };
    }
    if (!degree.field_of_study?.trim()) {
      return { error: `Field of study is required (row ${index + 1})` };
    }
    if (!degree.institution?.trim()) {
      return { error: `Institution is required (row ${index + 1})` };
    }
    if (!degree.country_code?.trim()) {
      return { error: `Country code is required (row ${index + 1})` };
    }
    if (
      degree.year_graduated !== null &&
      !Number.isFinite(degree.year_graduated)
    ) {
      return { error: `Year graduated must be a number (row ${index + 1})` };
    }
  }

  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("degree")
    .select("id")
    .eq("user_id", user.id);

  if (existingError) {
    return { error: existingError.message };
  }

  const existingIds = new Set((existing ?? []).map((row) => row.id));
  const incomingIds = new Set(
    degrees.map((degree) => degree.id).filter(Boolean) as string[],
  );
  const idsToDelete = [...existingIds].filter((id) => !incomingIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("degree")
      .delete()
      .in("id", idsToDelete);

    if (deleteError) {
      return { error: deleteError.message };
    }
  }

  const toUpdate = degrees.filter((degree) => degree.id);
  const toInsert = degrees.filter((degree) => !degree.id);

  if (toUpdate.length > 0) {
    const { error: updateError } = await supabase
      .from("degree")
      .upsert(
        toUpdate.map((degree) => ({
          id: degree.id,
          user_id: user.id,
          academic_level: degree.academic_level.trim(),
          degree_type: degree.degree_type.trim(),
          field_of_study: degree.field_of_study.trim(),
          institution: degree.institution.trim(),
          country_code: degree.country_code.trim().toUpperCase(),
          year_graduated: degree.year_graduated,
          updated_at: new Date().toISOString(),
        })),
      )
      .select("id");

    if (updateError) {
      return { error: updateError.message };
    }
  }

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from("degree").insert(
      toInsert.map((degree) => ({
        user_id: user.id,
        academic_level: degree.academic_level.trim(),
        degree_type: degree.degree_type.trim(),
        field_of_study: degree.field_of_study.trim(),
        institution: degree.institution.trim(),
        country_code: degree.country_code.trim().toUpperCase(),
        year_graduated: degree.year_graduated,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
    );

    if (insertError) {
      return { error: insertError.message };
    }
  }

  const refreshed = await getDegreesByUserId(user.id);

  return { data: refreshed };
}
