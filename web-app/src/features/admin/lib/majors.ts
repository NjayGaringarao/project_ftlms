"use server";

import { ExtendedMajor } from "@/features/shared/types/models";
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
        college_id,
        code,
        name,
        description,
        college:college_id (id, code, name, description)
      )
      `,
    )
    .order("name", { ascending: true });

  if (error) {
    console.error("lib.admin.majors.getMajorsList ::", error);
    return [];
  }

  return (data ?? []).map((item) => {
    const program = Array.isArray(item.program)
      ? item.program[0]
      : item.program;

    return {
      ...item,
      program: {
        ...program,
        college: Array.isArray(program?.college)
          ? program.college[0]
          : program?.college,
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
        college_id,
        code,
        name,
        description,
        college:college_id (id, code, name, description)
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
      college: Array.isArray(program?.college)
        ? program.college[0]
        : program?.college,
    },
  } as MajorListItem;
};

export const getMajorsByProgram = async (
  programId: string,
): Promise<MajorListItem[]> => {
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
        college_id,
        code,
        name,
        description,
        college:college_id (id, code, name, description)
      )
      `,
    )
    .eq("program_id", programId)
    .order("name", { ascending: true });

  if (error) {
    console.error("lib.admin.majors.getMajorsByProgram ::", error);
    return [];
  }

  return (data ?? []).map((item) => {
    const program = Array.isArray(item.program)
      ? item.program[0]
      : item.program;

    return {
      ...item,
      program: {
        ...program,
        college: Array.isArray(program?.college)
          ? program.college[0]
          : program?.college,
      },
    };
  }) as MajorListItem[];
};
