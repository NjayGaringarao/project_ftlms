"use server";

import { ExtendedProgramCampus, ExtendedProgram, Program } from "@/models";
import { createClient } from "@/utils/supabase/server";

export type ProgramListItem = Pick<
  Program,
  "id" | "code" | "name" | "description"
> & {
  college_id: string;
};

export type ProgramCampusOffering = ExtendedProgramCampus;

export const getPrograms = async (): Promise<ExtendedProgram[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("program")
    .select(
      `
      id,
      code,
      name,
      description,
      college_id,
      college:college_id (id, code, name, description)
      `,
    )
    .order("name", { ascending: true });

  if (error) {
    console.error("lib.admin.programs.getPrograms ::", error);
    return [];
  }

  const programs = (data ?? []).map((p) => ({
    ...p,
    college: Array.isArray(p.college) ? p.college[0] : p.college,
  })) as ExtendedProgram[];

  return programs;
};

export const getProgramsByCollege = async (
  collegeId: string,
): Promise<ExtendedProgram[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("program")
    .select(
      `
      id,
      code,
      name,
      description,
      college_id,
      college:college_id (id, code, name, description)
      `,
    )
    .eq("college_id", collegeId)
    .order("name", { ascending: true });

  if (error) {
    console.error("lib.admin.programs.getProgramsByCollege ::", error);
    return [];
  }

  const programs = (data ?? []).map((p) => ({
    ...p,
    college: Array.isArray(p.college) ? p.college[0] : p.college,
  })) as ExtendedProgram[];

  return programs;
};

export const getProgramsByCollegeAndCampus = async (
  collegeId: string,
  campusId: string,
): Promise<ExtendedProgram[]> => {
  const offerings = await getProgramCampusOfferings(campusId);
  return offerings
    .map((offering) => offering.program)
    .filter((program) => program.college_id === collegeId);
};

export const getProgramById = async (
  programId: string,
): Promise<ExtendedProgram | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("program")
    .select(
      `
      id,
      code,
      name,
      description,
      college_id,
      college:college_id (id, code, name, description)
      `,
    )
    .eq("id", programId)
    .maybeSingle();

  if (error) {
    console.error("lib.admin.programs.getProgramById ::", error);
    return null;
  }

  if (!data) return null;

  const program: ExtendedProgram = {
    ...data,
    college: Array.isArray(data.college) ? data.college[0] : data.college,
  };

  return program;
};

export const getProgramCampusOfferings = async (
  campusId?: string,
): Promise<ProgramCampusOffering[]> => {
  const supabase = await createClient();

  let query = supabase
    .from("program_offering")
    .select(
      `
      id,
      campus_id,
      program_id,
      campus:campus_id (id, name, address, zip_code),
      program:program_id (
        id,
        code,
        name,
        description,
        college_id,
        college:college_id (id, code, name, description)
      )
      `,
    )
    .order("id", { ascending: true });

  if (campusId?.trim()) {
    query = query.eq("campus_id", campusId.trim());
  }

  const { data, error } = await query;

  if (error) {
    console.error("lib.admin.programs.getProgramCampusOfferings ::", error);
    return [];
  }

  return (data ?? []).map((offering) => ({
    ...offering,
    campus: Array.isArray(offering.campus)
      ? offering.campus[0]
      : offering.campus,
    program: {
      ...(Array.isArray(offering.program)
        ? offering.program[0]
        : offering.program),
      college: Array.isArray(
        (Array.isArray(offering.program)
          ? offering.program[0]
          : offering.program
        )?.college,
      )
        ? (Array.isArray(offering.program)
            ? offering.program[0]
            : offering.program
          ).college[0]
        : (Array.isArray(offering.program)
            ? offering.program[0]
            : offering.program
          )?.college,
    },
  })) as ProgramCampusOffering[];
};
