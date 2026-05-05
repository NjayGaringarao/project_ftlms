"use server";

import { ProgramCampusOffering } from "@/features/admin/lib/programs";
import { createClient } from "@/utils/supabase/server";

export type ProgramOfferingListItem = ProgramCampusOffering;

export const getProgramOfferingsList = async (): Promise<
  ProgramOfferingListItem[]
> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("program_offering")
    .select(
      `
      id,
      code,
      campus_id,
      program_id,
      campus:campus_id (id, code, name, address),
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
    .order("id", { ascending: true });

  if (error) {
    console.error(
      "lib.admin.program-offerings.getProgramOfferingsList ::",
      error,
    );
    return [];
  }

  return (data ?? []).map((item) => {
    const program = Array.isArray(item.program)
      ? item.program[0]
      : item.program;

    return {
      ...item,
      campus: Array.isArray(item.campus) ? item.campus[0] : item.campus,
      program: {
        ...program,
        college: Array.isArray(program?.college)
          ? program.college[0]
          : program?.college,
      },
    };
  }) as ProgramOfferingListItem[];
};

export const getProgramOfferingById = async (
  offeringId: string,
): Promise<ProgramOfferingListItem | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("program_offering")
    .select(
      `
      id,
      campus_id,
      program_id,
      campus:campus_id (id, code, name, address),
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
    .eq("id", offeringId)
    .maybeSingle();

  if (error) {
    console.error(
      "lib.admin.program-offerings.getProgramOfferingById ::",
      error,
    );
    return null;
  }

  if (!data) return null;

  const program = Array.isArray(data.program) ? data.program[0] : data.program;

  return {
    ...data,
    campus: Array.isArray(data.campus) ? data.campus[0] : data.campus,
    program: {
      ...program,
      college: Array.isArray(program?.college)
        ? program.college[0]
        : program?.college,
    },
  } as ProgramOfferingListItem;
};

export const getProgramOfferingsByCampus = async (
  campusId: string,
): Promise<ProgramOfferingListItem[]> => {
  const offerings = await getProgramOfferingsList();
  return offerings.filter((offering) => offering.campus_id === campusId);
};
