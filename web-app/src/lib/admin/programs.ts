"use server";

import { ExtendedProgramCampus, ExtendedProgram, Program } from "@/models";
import { createClient } from "@/utils/supabase/server";

export type ProgramListItem = Pick<
  Program,
  "id" | "code" | "name" | "description"
> & {
  department_id: string;
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
      department_id,
      department:department_id (id, code, name, type, description)
      `,
    )
    .order("name", { ascending: true });

  if (error) {
    console.error("lib.admin.programs.getPrograms ::", error);
    return [];
  }

  const programs = (data ?? []).map((p) => ({
    ...p,
    department: Array.isArray(p.department) ? p.department[0] : p.department,
  })) as ExtendedProgram[];

  return programs;
};

export const getProgramsByDepartment = async (
  departmentId: string,
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
      department_id,
      department:department_id (id, code, name, type, description)
      `,
    )
    .eq("department_id", departmentId)
    .order("name", { ascending: true });

  if (error) {
    console.error("lib.admin.programs.getProgramsByDepartment ::", error);
    return [];
  }

  const programs = (data ?? []).map((p) => ({
    ...p,
    department: Array.isArray(p.department) ? p.department[0] : p.department,
  })) as ExtendedProgram[];

  return programs;
};

export const getProgramsByDepartmentAndCampus = async (
  departmentId: string,
  campusId: string,
): Promise<ExtendedProgram[]> => {
  const offerings = await getProgramCampusOfferings(campusId);
  return offerings
    .map((offering) => offering.program)
    .filter((program) => program.department_id === departmentId);
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
      department_id,
      department:department_id (id, code, name, type, description)
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
    department: Array.isArray(data.department)
      ? data.department[0]
      : data.department,
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
        department_id,
        department:department_id (id, code, name, type, description)
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
      department: Array.isArray(
        (Array.isArray(offering.program)
          ? offering.program[0]
          : offering.program
        )?.department,
      )
        ? (Array.isArray(offering.program)
            ? offering.program[0]
            : offering.program
          ).department[0]
        : (Array.isArray(offering.program)
            ? offering.program[0]
            : offering.program
          )?.department,
    },
  })) as ProgramCampusOffering[];
};
