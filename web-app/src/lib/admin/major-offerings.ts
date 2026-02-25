"use server";

import { ExtendedMajorPC } from "@/models";
import { createClient } from "@/utils/supabase/server";

export type MajorOfferingListItem = ExtendedMajorPC;

export const getMajorOfferingsList = async (): Promise<
  MajorOfferingListItem[]
> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("major_p_c")
    .select(
      `
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
        program:program_id (
          id,
          code,
          name,
          description,
          department_id,
          department:department_id (id, code, name, type, description)
        )
      )
      `,
    )
    .order("id", { ascending: true });

  if (error) {
    console.error("lib.admin.major-offerings.getMajorOfferingsList ::", error);
    return [];
  }

  return (data ?? []).map((item: any) => {
    const programCampus = Array.isArray(item.program_campus)
      ? item.program_campus[0]
      : item.program_campus;
    const program = Array.isArray(programCampus?.program)
      ? programCampus.program[0]
      : programCampus?.program;

    return {
      ...item,
      major: Array.isArray(item.major) ? item.major[0] : item.major,
      program_campus: {
        ...programCampus,
        campus: Array.isArray(programCampus?.campus)
          ? programCampus.campus[0]
          : programCampus?.campus,
        program: {
          ...program,
          department: Array.isArray(program?.department)
            ? program.department[0]
            : program?.department,
        },
      },
    };
  }) as MajorOfferingListItem[];
};

export const getMajorOfferingById = async (
  majorOfferingId: string,
): Promise<MajorOfferingListItem | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("major_p_c")
    .select(
      `
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
        program:program_id (
          id,
          code,
          name,
          description,
          department_id,
          department:department_id (id, code, name, type, description)
        )
      )
      `,
    )
    .eq("id", majorOfferingId)
    .maybeSingle();

  if (error) {
    console.error("lib.admin.major-offerings.getMajorOfferingById ::", error);
    return null;
  }

  if (!data) return null;

  const programCampus = Array.isArray(data.program_campus)
    ? data.program_campus[0]
    : data.program_campus;
  const program = Array.isArray(programCampus?.program)
    ? programCampus.program[0]
    : programCampus?.program;

  return {
    ...data,
    major: Array.isArray(data.major) ? data.major[0] : data.major,
    program_campus: {
      ...programCampus,
      campus: Array.isArray(programCampus?.campus)
        ? programCampus.campus[0]
        : programCampus?.campus,
      program: {
        ...program,
        department: Array.isArray(program?.department)
          ? program.department[0]
          : program?.department,
      },
    },
  } as MajorOfferingListItem;
};
