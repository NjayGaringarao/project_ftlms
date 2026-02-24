"use server";

import { ExtendedProgram, Program } from "@/models/program";
import { createClient } from "@/utils/supabase/server";

export type ProgramListItem = Pick<
  Program,
  "id" | "code" | "name" | "description"
> & {
  department_id: string;
  campus_id: string;
};

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
      campus_id,
      department:department_id (id, code, name, type, description),
      campus:campus_id (id, name, address, zip_code)
      `,
    )
    .order("name", { ascending: true });

  if (error) {
    console.error("lib.admin.programs.getPrograms ::", error);
    return [];
  }

  const programs = (data ?? []).map((p: any) => ({
    ...p,
    department: Array.isArray(p.department) ? p.department[0] : p.department,
    campus: Array.isArray(p.campus) ? p.campus[0] : p.campus,
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
      campus_id,
      department:department_id (id, code, name, type, description),
      campus:campus_id (id, name, address, zip_code)
      `,
    )
    .eq("department_id", departmentId)
    .order("name", { ascending: true });

  if (error) {
    console.error("lib.admin.programs.getProgramsByDepartment ::", error);
    return [];
  }

  const programs = (data ?? []).map((p: any) => ({
    ...p,
    department: Array.isArray(p.department) ? p.department[0] : p.department,
    campus: Array.isArray(p.campus) ? p.campus[0] : p.campus,
  })) as ExtendedProgram[];

  return programs;
};

export const getProgramsByDepartmentAndCampus = async (
  departmentId: string,
  campusId: string,
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
      campus_id,
      department:department_id (id, code, name, type, description),
      campus:campus_id (id, name, address, zip_code)
      `,
    )
    .eq("department_id", departmentId)
    .eq("campus_id", campusId)
    .order("name", { ascending: true });

  if (error) {
    console.error(
      "lib.admin.programs.getProgramsByDepartmentAndCampus ::",
      error,
    );
    return [];
  }

  const programs = (data ?? []).map((p: any) => ({
    ...p,
    department: Array.isArray(p.department) ? p.department[0] : p.department,
    campus: Array.isArray(p.campus) ? p.campus[0] : p.campus,
  })) as ExtendedProgram[];

  return programs;
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
      campus_id,
      department:department_id (id, code, name, type, description),
      campus:campus_id (id, name, address, zip_code)
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
    campus: Array.isArray(data.campus) ? data.campus[0] : data.campus,
  };

  return program;
};
