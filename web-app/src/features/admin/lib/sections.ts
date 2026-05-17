"use server";

import { createClient } from "@/utils/supabase/server";
import { ExtendedAcademicTerm, ExtendedSection } from "@/features/shared/types/models";

export type SectionListItem = ExtendedSection & {
  academic_term: ExtendedAcademicTerm | null;
  major_offering: ExtendedSection["major_offering"] & {
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
        code: string;
        name: string;
        address: string | null;
      } | null;
      program: {
        id: string;
        code: string;
        name: string;
        description: string | null;
        college_id: string;
      } | null;
    } | null;
  };
};

export const getSectionsList = async (): Promise<SectionListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("section")
    .select(
      `
      id,
      code,
      major_offering_id,
      academic_term_id,
      year_level,
      name,
      classification,
      student_count,
      academic_term:academic_term_id (
        id,
        code,
        academic_year_id,
        name
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
          campus:campus_id (id, code, name, address),
          program:program_id (id, code, name, description, college_id)
        )
      )
      `,
    )
    .order("year_level", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("lib.admin.sections.getSectionsList ::", error);
    return [];
  }

  return (data ?? []).map((item) => {
    const academicTerm = Array.isArray(item.academic_term)
      ? item.academic_term[0]
      : item.academic_term;
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
      academic_term: academicTerm,
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
  }) as SectionListItem[];
};

export const getSectionById = async (
  sectionId: string,
): Promise<SectionListItem | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("section")
    .select(
      `
      id,
      code,
      major_offering_id,
      academic_term_id,
      year_level,
      name,
      classification,
      student_count,
      academic_term:academic_term_id (
        id,
        code,
        academic_year_id,
        name,
        academic_year:academic_year_id (
          id,
          code,
          start_year,
          end_year
        )
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
          campus:campus_id (id, code, name, address),
          program:program_id (id, code, name, description, college_id)
        )
      )
      `,
    )
    .eq("id", sectionId)
    .maybeSingle();

  if (error) {
    console.error("lib.admin.sections.getSectionById ::", error);
    return null;
  }

  if (!data) return null;

  const majorOffering = Array.isArray(data.major_offering)
    ? data.major_offering[0]
    : data.major_offering;
  const academicTerm = Array.isArray(data.academic_term)
    ? data.academic_term[0]
    : data.academic_term;
  const major = Array.isArray(majorOffering?.major)
    ? majorOffering.major[0]
    : majorOffering?.major;
  const programOffering = Array.isArray(majorOffering?.program_offering)
    ? majorOffering.program_offering[0]
    : majorOffering?.program_offering;

  return {
    ...data,
    academic_term: {
      ...academicTerm,
      academic_year: academicTerm
        ? Array.isArray(academicTerm.academic_year)
          ? academicTerm.academic_year[0]
          : academicTerm.academic_year
        : null,
    },
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
  } as SectionListItem;
};

export const getSectionsByCampus = async (
  campusId: string,
): Promise<SectionListItem[]> => {
  const sections = await getSectionsList();
  return sections.filter(
    (section) => section.major_offering?.program_offering?.campus_id === campusId,
  );
};
