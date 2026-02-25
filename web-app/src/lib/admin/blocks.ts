"use server";

import { createClient } from "@/utils/supabase/server";
import { ExtendedBlock } from "@/models";

export type BlockListItem = ExtendedBlock & {
  major_p_c: ExtendedBlock["major_p_c"] & {
    major: {
      id: string;
      code: string;
      name: string;
      description: string | null;
      program_id: string;
    } | null;
    program_campus: {
      id: string;
      campus_id: string;
      program_id: string;
      campus: {
        id: string;
        name: string;
        address: string | null;
        zip_code: string | null;
      } | null;
      program: {
        id: string;
        code: string;
        name: string;
        description: string | null;
        department_id: string;
      } | null;
    } | null;
  };
};

export const getBlocksList = async (): Promise<BlockListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("block")
    .select(
      `
      id,
      major_p_c_id,
      year_level,
      section,
      student_count,
      major_p_c:major_p_c_id (
        id,
        program_campus_id,
        major_id,
        major:major_id (
          id,
          code,
          name,
          description,
          program_id
        ),
        program_campus:program_campus_id (
          id,
          campus_id,
          program_id,
          campus:campus_id (id, name, address, zip_code),
          program:program_id (id, code, name, description, department_id)
        )
      )
      `,
    )
    .order("year_level", { ascending: true })
    .order("section", { ascending: true });

  if (error) {
    console.error("lib.admin.blocks.getBlocksList ::", error);
    return [];
  }

  return (data ?? []).map((item: any) => {
    const majorPC = Array.isArray(item.major_p_c)
      ? item.major_p_c[0]
      : item.major_p_c;
    const major = Array.isArray(majorPC?.major)
      ? majorPC.major[0]
      : majorPC?.major;
    const programCampus = Array.isArray(majorPC?.program_campus)
      ? majorPC.program_campus[0]
      : majorPC?.program_campus;

    return {
      ...item,
      major_p_c: {
        ...majorPC,
        major,
        program_campus: {
          ...programCampus,
          campus: Array.isArray(programCampus?.campus)
            ? programCampus.campus[0]
            : programCampus?.campus,
          program: Array.isArray(programCampus?.program)
            ? programCampus.program[0]
            : programCampus?.program,
        },
      },
    };
  }) as BlockListItem[];
};

export const getBlockById = async (
  blockId: string,
): Promise<BlockListItem | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("block")
    .select(
      `
      id,
      major_p_c_id,
      year_level,
      section,
      student_count,
      major_p_c:major_p_c_id (
        id,
        program_campus_id,
        major_id,
        major:major_id (
          id,
          code,
          name,
          description,
          program_id
        ),
        program_campus:program_campus_id (
          id,
          campus_id,
          program_id,
          campus:campus_id (id, name, address, zip_code),
          program:program_id (id, code, name, description, department_id)
        )
      )
      `,
    )
    .eq("id", blockId)
    .maybeSingle();

  if (error) {
    console.error("lib.admin.blocks.getBlockById ::", error);
    return null;
  }

  if (!data) return null;

  const majorPC = Array.isArray(data.major_p_c)
    ? data.major_p_c[0]
    : data.major_p_c;
  const major = Array.isArray(majorPC?.major)
    ? majorPC.major[0]
    : majorPC?.major;
  const programCampus = Array.isArray(majorPC?.program_campus)
    ? majorPC.program_campus[0]
    : majorPC?.program_campus;

  return {
    ...data,
    major_p_c: {
      ...majorPC,
      major,
      program_campus: {
        ...programCampus,
        campus: Array.isArray(programCampus?.campus)
          ? programCampus.campus[0]
          : programCampus?.campus,
        program: Array.isArray(programCampus?.program)
          ? programCampus.program[0]
          : programCampus?.program,
      },
    },
  } as BlockListItem;
};
