"use server";

import { ExtendedProgramCampus } from "@/models";
import { createClient } from "@/utils/supabase/server";

export type ProgramOfferingListItem = ExtendedProgramCampus;

export const getProgramOfferingsList = async (): Promise<
  ProgramOfferingListItem[]
> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("program_campus")
    .select(
      `
      id,
      campus_id,
      program_id,
      campus:campus_id (id, name, address, zip_code),
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
    .order("id", { ascending: true });

  if (error) {
    console.error(
      "lib.admin.program-offerings.getProgramOfferingsList ::",
      error,
    );
    return [];
  }

  return (data ?? []).map((item: any) => {
    const program = Array.isArray(item.program)
      ? item.program[0]
      : item.program;

    return {
      ...item,
      campus: Array.isArray(item.campus) ? item.campus[0] : item.campus,
      program: {
        ...program,
        department: Array.isArray(program?.department)
          ? program.department[0]
          : program?.department,
      },
    };
  }) as ProgramOfferingListItem[];
};

export const getProgramOfferingById = async (
  offeringId: string,
): Promise<ProgramOfferingListItem | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("program_campus")
    .select(
      `
      id,
      campus_id,
      program_id,
      campus:campus_id (id, name, address, zip_code),
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
      department: Array.isArray(program?.department)
        ? program.department[0]
        : program?.department,
    },
  } as ProgramOfferingListItem;
};

export const getProgramOfferingsByCampus = async (
  campusId: string,
): Promise<ProgramOfferingListItem[]> => {
  const offerings = await getProgramOfferingsList();
  return offerings.filter((offering) => offering.campus_id === campusId);
};
