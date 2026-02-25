"use server";

import { ExtendedMajor } from "@/models";
import { createClient } from "@/utils/supabase/server";

export type MajorListItem = ExtendedMajor;

export const getMajorsList = async (): Promise<MajorListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("major")
    .select(
      `
      id,
      code,
      name,
      description,
      program_id,
      program:program_id (
        id,
        department_id,
        code,
        name,
        description,
        department:department_id (id, code, name, type, description)
      )
      `,
    )
    .order("name", { ascending: true });

  if (error) {
    console.error("lib.admin.majors.getMajorsList ::", error);
    return [];
  }

  return (data ?? []).map((item: any) => {
    const program = Array.isArray(item.program)
      ? item.program[0]
      : item.program;

    return {
      ...item,
      program: {
        ...program,
        department: Array.isArray(program?.department)
          ? program.department[0]
          : program?.department,
      },
    };
  }) as MajorListItem[];
};

export const getMajorById = async (
  majorId: string,
): Promise<MajorListItem | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("major")
    .select(
      `
      id,
      code,
      name,
      description,
      program_id,
      program:program_id (
        id,
        department_id,
        code,
        name,
        description,
        department:department_id (id, code, name, type, description)
      )
      `,
    )
    .eq("id", majorId)
    .maybeSingle();

  if (error) {
    console.error("lib.admin.majors.getMajorById ::", error);
    return null;
  }

  if (!data) return null;

  const program = Array.isArray(data.program) ? data.program[0] : data.program;

  return {
    ...data,
    program: {
      ...program,
      department: Array.isArray(program?.department)
        ? program.department[0]
        : program?.department,
    },
  } as MajorListItem;
};

export const getMajorsByProgram = async (
  programId: string,
): Promise<MajorListItem[]> => {
  const majors = await getMajorsList();
  return majors.filter((major) => major.program_id === programId);
};
