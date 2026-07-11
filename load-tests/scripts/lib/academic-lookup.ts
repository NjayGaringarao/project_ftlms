import type { SupabaseClient } from "@supabase/supabase-js";

export const resolveCampusIdByName = async (
  admin: SupabaseClient,
  name: string,
): Promise<string> => {
  const { data, error } = await admin
    .from("campus")
    .select("id")
    .ilike("name", name)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(`No campus named "${name}" found. Check supabase/seeds/1003_campuses.sql.`);
  }
  return data.id;
};

export const resolveCollegeIdByCode = async (
  admin: SupabaseClient,
  code: string,
): Promise<string> => {
  const { data, error } = await admin
    .from("college")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(`No college with code "${code}" found. Check supabase/seeds/1002_colleges.sql.`);
  }
  return data.id;
};

export const resolveProgramOfferingId = async (
  admin: SupabaseClient,
  campusId: string,
  programCode: string,
): Promise<{ programOfferingId: string; collegeId: string }> => {
  const { data, error } = await admin
    .from("program_offering")
    .select("id, program:program_id!inner ( code, college_id )")
    .eq("campus_id", campusId)
    .eq("program.code", programCode)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(
      `No program_offering found for campus_id=${campusId} + program "${programCode}". ` +
        "Check supabase/seeds/1006_program_offerings.sql.",
    );
  }
  const program = Array.isArray(data.program) ? data.program[0] : data.program;
  if (!program) {
    throw new Error(`program_offering ${data.id} has no linked program row.`);
  }
  return { programOfferingId: data.id, collegeId: program.college_id };
};
