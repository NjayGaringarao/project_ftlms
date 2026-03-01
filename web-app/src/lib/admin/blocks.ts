"use server";

import { createClient } from "@/utils/supabase/server";
import { ExtendedBlock } from "@/models";

export type BlockListItem = ExtendedBlock & {
  curriculum: {
    id: string;
    major_id: string;
    title: string;
    series_year: number;
    revised_year: number | null;
  } | null;
  major_offering: ExtendedBlock["major_offering"] & {
    major: {
      id: string;
      code: string;
      name: string;
      description: string | null;
      program_id: string;
    } | null;
    program_offering: {
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
      major_offering_id,
      curriculum_id,
      year_level,
      section,
      student_count,
      curriculum:curriculum_id (
        id,
        major_id,
        title,
        series_year,
        revised_year
      ),
      major_offering:major_offering_id (
        id,
        program_offering_id,
        major_id,
        major:major_id (
          id,
          code,
          name,
          description,
          program_id
        ),
        program_offering:program_offering_id (
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

  return (data ?? []).map((item) => {
    const curriculum = Array.isArray(item.curriculum)
      ? item.curriculum[0]
      : item.curriculum;
    const majorOffering = Array.isArray(item.major_offering)
      ? item.major_offering[0]
      : item.major_offering;
    const major = Array.isArray(majorOffering?.major)
      ? majorOffering.major[0]
      : majorOffering?.major;
    const programOffering = Array.isArray(majorOffering?.program_offering)
      ? majorOffering.program_offering[0]
      : majorOffering?.program_offering;

    return {
      ...item,
      curriculum,
      major_offering: {
        ...majorOffering,
        major,
        program_offering: {
          ...programOffering,
          campus: Array.isArray(programOffering?.campus)
            ? programOffering.campus[0]
            : programOffering?.campus,
          program: Array.isArray(programOffering?.program)
            ? programOffering.program[0]
            : programOffering?.program,
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
      major_offering_id,
      curriculum_id,
      year_level,
      section,
      student_count,
      curriculum:curriculum_id (
        id,
        major_id,
        title,
        series_year,
        revised_year
      ),
      major_offering:major_offering_id (
        id,
        program_offering_id,
        major_id,
        major:major_id (
          id,
          code,
          name,
          description,
          program_id
        ),
        program_offering:program_offering_id (
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

  const majorOffering = Array.isArray(data.major_offering)
    ? data.major_offering[0]
    : data.major_offering;
  const curriculum = Array.isArray(data.curriculum)
    ? data.curriculum[0]
    : data.curriculum;
  const major = Array.isArray(majorOffering?.major)
    ? majorOffering.major[0]
    : majorOffering?.major;
  const programOffering = Array.isArray(majorOffering?.program_offering)
    ? majorOffering.program_offering[0]
    : majorOffering?.program_offering;

  return {
    ...data,
    curriculum,
    major_offering: {
      ...majorOffering,
      major,
      program_offering: {
        ...programOffering,
        campus: Array.isArray(programOffering?.campus)
          ? programOffering.campus[0]
          : programOffering?.campus,
        program: Array.isArray(programOffering?.program)
          ? programOffering.program[0]
          : programOffering?.program,
      },
    },
  } as BlockListItem;
};

export const getBlocksByCampus = async (
  campusId: string,
): Promise<BlockListItem[]> => {
  const blocks = await getBlocksList();
  return blocks.filter(
    (block) => block.major_offering?.program_offering?.campus_id === campusId,
  );
};
