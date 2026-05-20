"use server";

import { createClient } from "@/utils/supabase/server";
import { calculateAtl } from "@/features/course-loading/lib/calculations";
import { getCurrentUser } from "@/features/auth/lib/utils";
import { Identity } from "@/features/shared/types/models/identity";
import { ExtendedDesignation } from "@/features/shared/types/models/designation";
import { Degree } from "@/features/shared/types/models/degree";
import { AcademicRank } from "@/features/shared/types/models/academic_rank";
import { Campus } from "@/features/shared/types/models/campus";
import { College } from "@/features/shared/types/models/college";
import { User } from "@/features/shared/types/models/user";
import { ExtendedAcademicTerm } from "@/features/shared/types/models/academic_term";

export type IdentityUpdateInput = {
  name: string;
  birth_date?: string | null;
  address?: string | null;
  contact_number?: string | null;
};

export const getIdentityByUserId = async (
  userId: string,
): Promise<Identity | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("identity")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("lib.me.profile.getIdentityByUserId ::", error);
    return null;
  }

  return data as Identity;
};

export async function getIdentityForCurrentUser(): Promise<Identity | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return getIdentityByUserId(user.id);
}

export async function upsertIdentityForCurrentUser(
  input: IdentityUpdateInput,
): Promise<{ data?: Identity; error?: string }> {
  const user = await getCurrentUser();

  if (!user) return { error: "Not authenticated" };

  if (!input.name?.trim()) return { error: "Full name is required" };

  const supabase = await createClient();

  const payload: Identity = {
    user_id: user.id,
    name: input.name.trim(),
    birth_date: input.birth_date?.trim() ? input.birth_date : null,
    address: input.address ?? null,
    contact_number: input.contact_number ?? null,
  };

  const { data, error } = await supabase
    .from("identity")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: data as Identity };
}

export type ProfessionalInfo = {
  user: User | null;
  rank: AcademicRank | null;
  designations: ProfessionalDesignation[];
  campus: Campus | null;
  college: College | null;
};

export type ProfessionalDesignation = Omit<ExtendedDesignation, "user">;

type DesignationRow = {
  id: string;
  user_id: string;
  campus_id: string | null;
  college_id: string | null;
  program_offering_id: string | null;
  room_id: string | null;
  job_title: string;
  load: number | null;
  designated_at: string;
  campus:
    | ProfessionalDesignation["campus"]
    | ProfessionalDesignation["campus"][]
    | null;
  college:
    | ProfessionalDesignation["college"]
    | ProfessionalDesignation["college"][]
    | null;
};

type ProgramOfferingRow = {
  id: string;
  campus_id: string;
  program_id: string;
  campus:
    | ProfessionalDesignation["campus"]
    | ProfessionalDesignation["campus"][]
    | null;
  program:
    | ProfessionalDesignation["program"]
    | ProfessionalDesignation["program"][]
    | null;
};

export const getProfessionalInfoByUserId = async (
  userId: string,
): Promise<ProfessionalInfo> => {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase
    .from("user")
    .select(
      "id, academic_rank_id, employment_status, campus_id, college_id, academic_rank ( id, code, title, description ), campus:campus_id ( id, code, name, address ), college:college_id ( id, code, name, description )",
    )
    .eq("id", userId)
    .single();

  if (userError && userError.code !== "PGRST116") {
    console.error(
      "lib.me.profile.getProfessionalInfoByUserId.user ::",
      userError,
    );
  }

  const user: User | null = userData
    ? {
        id: userData.id,
        academic_rank_id: userData.academic_rank_id,
        employment_status: userData.employment_status,
        campus_id: userData.campus_id ?? null,
        college_id: userData.college_id ?? null,
      }
    : null;

  const rank: AcademicRank | null = userData?.academic_rank
    ? Array.isArray(userData.academic_rank)
      ? (userData.academic_rank[0] as AcademicRank)
      : (userData.academic_rank as AcademicRank)
    : null;

  const campus: Campus | null = userData?.campus
    ? Array.isArray(userData.campus)
      ? (userData.campus[0] as Campus)
      : (userData.campus as Campus)
    : null;

  const college: College | null = userData?.college
    ? Array.isArray(userData.college)
      ? (userData.college[0] as College)
      : (userData.college as College)
    : null;

  const { data: designationData, error: designationError } = await supabase
    .from("designation")
    .select(
      "id, user_id, campus_id, college_id, program_offering_id, room_id, job_title, load, designated_at, campus ( id, code, name, address ), college:college_id ( id, code, name, description )",
    )
    .eq("user_id", userId)
    .order("job_title", { ascending: true });

  if (designationError) {
    console.error(
      "lib.me.profile.getProfessionalInfoByUserId.designations ::",
      designationError,
    );
  }

  const programOfferingIds = Array.from(
    new Set(
      (designationData ?? [])
        .map((row) => (row as DesignationRow).program_offering_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const programOfferingMap = new Map<
    string,
    ProfessionalDesignation["program_offering"]
  >();
  const programMap = new Map<string, ProfessionalDesignation["program"]>();

  if (programOfferingIds.length > 0) {
    const { data: offeringData, error: offeringError } = await supabase
      .from("program_offering")
      .select(
        "id, campus_id, program_id, campus:campus_id ( id, code, name, address ), program:program_id ( id, college_id, code, name, description, college:college_id ( id, code, name, description ) )",
      )
      .in("id", programOfferingIds);

    if (offeringError) {
      console.error(
        "lib.me.profile.getProfessionalInfoByUserId.programOfferings ::",
        offeringError,
      );
    }

    (offeringData ?? []).forEach((raw) => {
      const row = raw as ProgramOfferingRow;
      const campus = Array.isArray(row.campus) ? (row.campus[0] ?? null) : row.campus;
      const program = Array.isArray(row.program)
        ? (row.program[0] ?? null)
        : row.program;

      const offering = {
        id: row.id,
        campus_id: row.campus_id,
        program_id: row.program_id,
        campus,
        program,
      } as ProfessionalDesignation["program_offering"];

      programOfferingMap.set(row.id, offering);
      if (program) {
        programMap.set(row.id, program);
      }
    });
  }

  const designations: ProfessionalDesignation[] = (designationData ?? []).map(
    (raw) => {
      const d = raw as DesignationRow;
      const directCampus = Array.isArray(d.campus)
        ? (d.campus[0] ?? null)
        : d.campus;
      const college = Array.isArray(d.college)
        ? (d.college[0] ?? null)
        : d.college;
      const programOffering = d.program_offering_id
        ? (programOfferingMap.get(d.program_offering_id) ?? null)
        : null;
      const program = d.program_offering_id
        ? (programMap.get(d.program_offering_id) ?? null)
        : null;

      return {
        id: d.id,
        user_id: d.user_id,
        campus_id: d.campus_id,
        college_id: d.college_id,
        program_offering_id: d.program_offering_id,
        room_id: d.room_id,
        job_title: d.job_title,
        load: d.load,
        designated_at: d.designated_at,
        position: d.job_title,
        campus: directCampus,
        college,
        program,
        program_offering: programOffering,
      };
    },
  );

  return {
    user,
    rank,
    designations,
    campus,
    college,
  };
};

export async function getProfessionalInfoForCurrentUser(): Promise<ProfessionalInfo> {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, rank: null, designations: [], campus: null, college: null };
  }

  return getProfessionalInfoByUserId(user.id);
}

export type CurrentTermClassLoad = {
  id: string;
  course_code: string;
  course_title: string;
  lecture_hour: number;
  laboratory_hour: number;
  year_section: string;
  campus_name: string;
  load: number;
};

export type CurrentTermTeachingLoad = {
  term: ExtendedAcademicTerm | null;
  classes: CurrentTermClassLoad[];
  actual_teaching_load: number;
};

type RawCurrentTermRow = {
  id: string;
  code: string;
  academic_year_id: string;
  name: ExtendedAcademicTerm["name"];
  start: string;
  end: string;
  academic_year:
    | {
        id: string;
        code: string;
        start_year: number;
        end_year: number;
      }
    | Array<{
        id: string;
        code: string;
        start_year: number;
        end_year: number;
      }>;
};

const first = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

export const getCurrentTermTeachingLoadByUserId = async (
  userId: string,
): Promise<CurrentTermTeachingLoad> => {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: currentTermData, error: currentTermError } = await supabase
    .from("academic_term")
    .select(
      "id, code, academic_year_id, name, start, end, academic_year:academic_year_id(id, code, start_year, end_year)",
    )
    .lte("start", today)
    .gte("end", today)
    .order("start", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (currentTermError) {
    console.error(
      "lib.me.profile.getCurrentTermTeachingLoadByUserId.currentTerm ::",
      currentTermError,
    );
  }

  const term = currentTermData
    ? (() => {
        const rawTerm = currentTermData as RawCurrentTermRow;
        const academicYear = Array.isArray(rawTerm.academic_year)
          ? rawTerm.academic_year[0]
          : rawTerm.academic_year;

        return {
          ...rawTerm,
          academic_year: academicYear,
        } as ExtendedAcademicTerm;
      })()
    : null;

  if (!term) {
    return {
      term: null,
      classes: [],
      actual_teaching_load: 0,
    };
  }

  const { data: classData, error: classError } = await supabase
    .from("user_class")
    .select(
      `
      class:class_id(
        id,
        course_utilization(
          course:course_id(code, title, lecture_unit, laboratory_unit),
          section:section_id(
            year_level,
  name,
            major_offering:major_offering_id(
              program_offering:program_offering_id(
                campus:campus_id(name)
              )
            )
          )
        )
      )
      `,
    )
    .eq("user_id", userId)
    .eq("class.course_utilization.section.academic_term_id", term.id);

  if (classError) {
    console.error(
      "lib.me.profile.getCurrentTermTeachingLoadByUserId.classes ::",
      classError,
    );
    return {
      term,
      classes: [],
      actual_teaching_load: 0,
    };
  }

  const classRows = (classData ?? []).flatMap((row) => {
    const cls = row.class;
    if (!cls) return [];
    return Array.isArray(cls) ? cls : [cls];
  });

  const classes: CurrentTermClassLoad[] = classRows.map((cls) => {
      const utilizations = cls.course_utilization ?? [];
      const firstUtil = utilizations[0];
      const course = first(firstUtil?.course);
      const lectureHour = Number(course?.lecture_unit ?? 0);
      const laboratoryHour = Number(course?.laboratory_unit ?? 0);

      const sections = utilizations.flatMap((item) => {
        const section = item.section;
        if (!section) return [];
        return Array.isArray(section) ? section : [section];
      });

      const yearSection = sections
        .map((section) => {
          const yearLevel = section?.year_level;
          const sectionName = section?.name;
          if (!yearLevel || !sectionName) return null;
          return `${yearLevel} - ${sectionName}`;
        })
        .filter((value): value is string => Boolean(value))
        .join(", ");

      const campusName = Array.from(
        new Set(
          sections
            .map(
              (section) => {
                const majorOffering = first(section?.major_offering);
                const programOffering = first(majorOffering?.program_offering);
                const campus = first(programOffering?.campus);
                return campus?.name ?? null;
              },
            )
            .filter((value): value is string => Boolean(value)),
        ),
      ).join(", ");

      const load = calculateAtl(lectureHour, laboratoryHour);

      return {
        id: cls.id,
        course_code: course?.code ?? "Unknown",
        course_title: course?.title ?? "Untitled Course",
        lecture_hour: lectureHour,
        laboratory_hour: laboratoryHour,
        year_section: yearSection || "Not assigned",
        campus_name: campusName || "Not assigned",
        load,
      };
    });

  const actualTeachingLoad = classes.reduce((sum, item) => sum + item.load, 0);

  return {
    term,
    classes,
    actual_teaching_load: actualTeachingLoad,
  };
};

export type DegreeInput = {
  id?: string;
  academic_level: string;
  title: string;
  institution: string;
  country_code: string;
  year_graduated: number | null;
};

export const getDegreesByUserId = async (userId: string): Promise<Degree[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("degree")
    .select("*")
    .eq("user_id", userId)
    .order("year_graduated", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("lib.me.profile.getDegreesByUserId ::", error);
    return [];
  }

  return (data ?? []) as Degree[];
};

export async function saveDegreesForCurrentUser(
  degrees: DegreeInput[],
): Promise<{ data?: Degree[]; error?: string }> {
  const user = await getCurrentUser();

  if (!user) return { error: "Not authenticated" };

  for (const [index, degree] of degrees.entries()) {
    if (!degree.academic_level?.trim()) {
      return { error: `Academic level is required (row ${index + 1})` };
    }
    if (!degree.title?.trim()) {
      return { error: `Degree title is required (row ${index + 1})` };
    }
    if (!degree.institution?.trim()) {
      return { error: `Institution is required (row ${index + 1})` };
    }
    if (!degree.country_code?.trim()) {
      return { error: `Country code is required (row ${index + 1})` };
    }
    if (
      degree.year_graduated !== null &&
      !Number.isFinite(degree.year_graduated)
    ) {
      return { error: `Year graduated must be a number (row ${index + 1})` };
    }
  }

  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("degree")
    .select("id")
    .eq("user_id", user.id);

  if (existingError) {
    return { error: existingError.message };
  }

  const existingIds = new Set((existing ?? []).map((row) => row.id));
  const incomingIds = new Set(
    degrees.map((degree) => degree.id).filter(Boolean) as string[],
  );
  const idsToDelete = [...existingIds].filter((id) => !incomingIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("degree")
      .delete()
      .in("id", idsToDelete);

    if (deleteError) {
      return { error: deleteError.message };
    }
  }

  const toUpdate = degrees.filter((degree) => degree.id);
  const toInsert = degrees.filter((degree) => !degree.id);

  if (toUpdate.length > 0) {
    const { error: updateError } = await supabase
      .from("degree")
      .upsert(
        toUpdate.map((degree) => ({
          id: degree.id,
          user_id: user.id,
          academic_level: degree.academic_level.trim(),
          title: degree.title.trim(),
          institution: degree.institution.trim(),
          country_code: degree.country_code.trim().toUpperCase(),
          year_graduated: degree.year_graduated,
          updated_at: new Date().toISOString(),
        })),
      )
      .select("id");

    if (updateError) {
      return { error: updateError.message };
    }
  }

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from("degree").insert(
      toInsert.map((degree) => ({
        user_id: user.id,
        academic_level: degree.academic_level.trim(),
        title: degree.title.trim(),
        institution: degree.institution.trim(),
        country_code: degree.country_code.trim().toUpperCase(),
        year_graduated: degree.year_graduated,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
    );

    if (insertError) {
      return { error: insertError.message };
    }
  }

  const refreshed = await getDegreesByUserId(user.id);

  return { data: refreshed };
}
