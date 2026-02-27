"use server";

import { ExtendedCurriculum } from "@/models";
import { createClient } from "@/utils/supabase/server";

export type CurriculumListItem = ExtendedCurriculum & {
  major: ExtendedCurriculum["major"] & {
    program: {
      id: string;
      department_id: string;
      code: string;
      name: string;
      description: string | null;
      department: {
        id: string;
        code: string;
        name: string;
        type:
          | "ACADEMIC"
          | "ADMINISTRATIVE"
          | "STUDENT_SERVICES"
          | "EXTENSION_SERVICES";
        description: string | null;
      } | null;
    } | null;
  };
};

const normalizeCurriculumRow = (item: any): CurriculumListItem => {
  const major = Array.isArray(item.major) ? item.major[0] : item.major;
  const program = Array.isArray(major?.program)
    ? major.program[0]
    : major?.program;

  return {
    ...item,
    major: {
      ...major,
      program: {
        ...program,
        department: Array.isArray(program?.department)
          ? program.department[0]
          : program?.department,
      },
    },
  } as CurriculumListItem;
};

export const getCurriculumsByMajor = async (
  majorId: string,
): Promise<CurriculumListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("curriculum")
    .select(
      `
      id,
      major_id,
      title,
      series_year,
      revised_year,
      major:major_id (
        id,
        program_id,
        code,
        name,
        description,
        program:program_id (
          id,
          department_id,
          code,
          name,
          description,
          department:department_id (id, code, name, type, description)
        )
      )
      `,
    )
    .eq("major_id", majorId)
    .order("series_year", { ascending: false })
    .order("title", { ascending: true });

  if (error) {
    console.error("lib.admin.curriculums.getCurriculumsByMajor ::", error);
    return [];
  }

  return (data ?? []).map(normalizeCurriculumRow);
};

export const getCurriculumsList = async (): Promise<CurriculumListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("curriculum")
    .select(
      `
      id,
      major_id,
      title,
      series_year,
      revised_year,
      major:major_id (
        id,
        program_id,
        code,
        name,
        description,
        program:program_id (
          id,
          department_id,
          code,
          name,
          description,
          department:department_id (id, code, name, type, description)
        )
      )
      `,
    )
    .order("series_year", { ascending: false })
    .order("title", { ascending: true });

  if (error) {
    console.error("lib.admin.curriculums.getCurriculumsList ::", error);
    return [];
  }

  return (data ?? []).map(normalizeCurriculumRow);
};

export const getCurriculumById = async (
  curriculumId: string,
): Promise<CurriculumListItem | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("curriculum")
    .select(
      `
      id,
      major_id,
      title,
      series_year,
      revised_year,
      major:major_id (
        id,
        program_id,
        code,
        name,
        description,
        program:program_id (
          id,
          department_id,
          code,
          name,
          description,
          department:department_id (id, code, name, type, description)
        )
      )
      `,
    )
    .eq("id", curriculumId)
    .maybeSingle();

  if (error) {
    console.error("lib.admin.curriculums.getCurriculumById ::", error);
    return null;
  }

  if (!data) return null;
  return normalizeCurriculumRow(data);
};
