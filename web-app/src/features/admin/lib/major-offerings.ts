"use server";

import { ExtendedMajorOffering } from "@/features/shared/types/models";
import { createClient } from "@/utils/supabase/server";

export type MajorOfferingListItem = ExtendedMajorOffering & {
  major: ExtendedMajorOffering["major"] & {
    description: string | null;
    program_id: string;
  };
  program_offering: {
    id: string;
    campus_id: string;
    program_id: string;
    campus: {
      id: string;
      name: string;
      address: string | null;
    } | null;
    program: {
      id: string;
      code: string;
      name: string;
      description: string | null;
      college_id: string;
      college: {
        id: string;
        code: string;
        name: string;
        description: string | null;
      } | null;
    } | null;
  };
};

export const getMajorOfferingsList = async (): Promise<
  MajorOfferingListItem[]
> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("major_offering")
    .select(
      `
      id,
      code,
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
        campus:campus_id (id, name, address),
        program:program_id (
          id,
          code,
          name,
          description,
          college_id,
          college:college_id (id, code, name, description)
        )
      )
      `,
    )
    .order("id", { ascending: true });

  if (error) {
    console.error("lib.admin.major-offerings.getMajorOfferingsList ::", error);
    return [];
  }

  return (data ?? []).map((item) => {
    const programOffering = Array.isArray(item.program_offering)
      ? item.program_offering[0]
      : item.program_offering;
    const program = Array.isArray(programOffering?.program)
      ? programOffering.program[0]
      : programOffering?.program;

    return {
      ...item,
      major: Array.isArray(item.major) ? item.major[0] : item.major,
      program_offering: {
        ...programOffering,
        campus: Array.isArray(programOffering?.campus)
          ? programOffering.campus[0]
          : programOffering?.campus,
        program: {
          ...program,
          college: Array.isArray(program?.college)
            ? program.college[0]
            : program?.college,
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
    .from("major_offering")
    .select(
      `
      id,
      code,
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
        campus:campus_id (id, name, address),
        program:program_id (
          id,
          code,
          name,
          description,
          college_id,
          college:college_id (id, code, name, description)
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

  const programOffering = Array.isArray(data.program_offering)
    ? data.program_offering[0]
    : data.program_offering;
  const program = Array.isArray(programOffering?.program)
    ? programOffering.program[0]
    : programOffering?.program;

  return {
    ...data,
    major: Array.isArray(data.major) ? data.major[0] : data.major,
    program_offering: {
      ...programOffering,
      campus: Array.isArray(programOffering?.campus)
        ? programOffering.campus[0]
        : programOffering?.campus,
      program: {
        ...program,
        college: Array.isArray(program?.college)
          ? program.college[0]
          : program?.college,
      },
    },
  } as MajorOfferingListItem;
};

export const getMajorOfferingsByProgramOffering = async (
  programOfferingId: string,
): Promise<MajorOfferingListItem[]> => {
  const offerings = await getMajorOfferingsList();
  return offerings.filter(
    (offering) => offering.program_offering_id === programOfferingId,
  );
};
