"use server";

import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { Identity } from "@/models/identity";
import { ExtendedDesignation } from "@/models/designation";
import { Degree } from "@/models/degree";
import { AcademicRank } from "@/models/academic_rank";
import { User } from "@/models/user";
import { AcademicTerm } from "@/models/academic_term";

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
      "id, academic_rank_id, employment_status, academic_rank ( id, code, title, description )",
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
      }
    : null;

  const rank: AcademicRank | null = userData?.academic_rank
    ? Array.isArray(userData.academic_rank)
      ? (userData.academic_rank[0] as AcademicRank)
      : (userData.academic_rank as AcademicRank)
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
  };
};

export async function getProfessionalInfoForCurrentUser(): Promise<ProfessionalInfo> {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, rank: null, designations: [] };
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
  term: AcademicTerm | null;
  classes: CurrentTermClassLoad[];
  actual_teaching_load: number;
};

export const getCurrentTermTeachingLoadByUserId = async (
  userId: string,
): Promise<CurrentTermTeachingLoad> => {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: currentTermData, error: currentTermError } = await supabase
    .from("academic_term")
    .select(
      "id, code, academic_year_start, academic_year_end, term_order, type, start, end",
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

  const term = (currentTermData as AcademicTerm | null) ?? null;

  if (!term) {
    return {
      term: null,
      classes: [],
      actual_teaching_load: 0,
    };
  }

  const { data: scheduleData, error: scheduleError } = await supabase
    .from("schedule")
    .select("id")
    .eq("user_id", userId)
    .eq("academic_term_id", term.id)
    .maybeSingle();

  if (scheduleError) {
    console.error(
      "lib.me.profile.getCurrentTermTeachingLoadByUserId.schedule ::",
      scheduleError,
    );
  }

  if (!scheduleData?.id) {
    return {
      term,
      classes: [],
      actual_teaching_load: 0,
    };
  }

  const { data: classData, error: classError } = await supabase
    .from("class_delivery")
    .select(
      "id, course_allocation:course_allocation!inner(schedule_id, course_offering:course_offering!inner(course:course!inner(code, title, lecture_hour, laboratory_hour))), class_delivery_block(block:block(year_level, section, major_offering:major_offering!inner(program_offering:program_offering!inner(campus:campus!inner(name)))))",
    )
    .eq("course_allocation.schedule_id", scheduleData.id);

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

  const classes: CurrentTermClassLoad[] = (classData ?? []).map((row) => {
    const typedRow = row as {
      id: string;
      course_allocation?: {
        course_offering?: {
          course?: {
            code?: string | null;
            title?: string | null;
            lecture_hour?: number | null;
            laboratory_hour?: number | null;
          } | null;
        } | null;
      } | null;
      class_delivery_block?: Array<{
        block?: {
          year_level?: number | null;
          section?: string | null;
          major_offering?: {
            program_offering?: {
              campus?: {
                name?: string | null;
              } | null;
            } | null;
          } | null;
        } | null;
      }> | null;
    };

    const course = typedRow.course_allocation?.course_offering?.course;
    const lectureHour = Number(course?.lecture_hour ?? 0);
    const laboratoryHour = Number(course?.laboratory_hour ?? 0);

    const blocks = (typedRow.class_delivery_block ?? [])
      .map((item) => item.block)
      .filter(Boolean);

    const yearSection = blocks
      .map((block) => {
        const yearLevel = block?.year_level;
        const section = block?.section;
        if (!yearLevel || !section) return null;
        return `${yearLevel} - ${section}`;
      })
      .filter((value): value is string => Boolean(value))
      .join(", ");

    const campusName = Array.from(
      new Set(
        blocks
          .map(
            (block) =>
              block?.major_offering?.program_offering?.campus?.name ?? null,
          )
          .filter((value): value is string => Boolean(value)),
      ),
    ).join(", ");

    const load = lectureHour + laboratoryHour * 0.75;

    return {
      id: typedRow.id,
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
