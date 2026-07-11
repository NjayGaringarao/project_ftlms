import type { SupabaseClient } from "@supabase/supabase-js";
import type { SeedScope } from "./scope";

// Builds a realistic campus_college_load_revision.snapshot payload from the
// scope's REAL data (the actual Castillejos/BSCS term from seed-scope.json,
// not the synthetic far-future terms the eval batch uses — those have no
// classes, so a snapshot built against them would be near-empty).
//
// Goal: realistic SHAPE and SIZE — the JSONB/TOAST write cost of a real
// submit — not bit-identical business logic. The app's builder is
// web-app/src/features/campus-college-load/lib/snapshot.ts
// (buildCampusCollegeLoadSnapshot); the structure below mirrors its output
// (metadata / faculty_load / class_schedule) with the same per-row fields,
// but derived-value rules (load credit fallbacks, name formatting details)
// are intentionally simplified. If snapshot.ts changes shape, update this.
//
// LOAD_TEST_SNAPSHOT_MULTIPLIER (default 1) duplicates the faculty and class
// entries to pad the fixture toward production-scale sizes when local seed
// data is small.

type IdentityRow = {
  user_id?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  suffix?: string | null;
  professional_extension?: string | null;
};

type SnapshotSession = {
  day: string;
  start_time: string;
  end_time: string;
  type: string;
  room_code: string | null;
  room_name: string | null;
};

const first = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

const toMinutes = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
};

const durationHours = (start?: string | null, end?: string | null): number => {
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  if (startMin === null || endMin === null || endMin <= startMin) return 0;
  return (endMin - startMin) / 60;
};

const formatIdentityName = (identity: IdentityRow | null): string | null => {
  if (!identity) return null;
  const middleInitial = identity.middle_name?.trim()
    ? ` ${identity.middle_name.trim()[0]}.`
    : "";
  const suffix = identity.suffix?.trim() ? ` ${identity.suffix.trim()}` : "";
  const name = `${identity.last_name ?? ""}, ${identity.first_name ?? ""}${middleInitial}${suffix}`.trim();
  return name === "," ? null : name;
};

export const buildSnapshotFixture = async (
  admin: SupabaseClient,
  scope: SeedScope,
): Promise<Record<string, unknown>> => {
  const [{ data: campus }, { data: college }, { data: academicTerm }] =
    await Promise.all([
      admin.from("campus").select("code, name").eq("id", scope.campusId).maybeSingle(),
      admin.from("college").select("code, name").eq("id", scope.collegeId).maybeSingle(),
      admin
        .from("academic_term")
        .select("code, name, academic_year:academic_year_id(code)")
        .eq("id", scope.academicTermId)
        .maybeSingle(),
    ]);

  const { data: majorOfferings, error: majorOfferingError } = await admin
    .from("major_offering")
    .select("id")
    .eq("program_offering_id", scope.programOfferingId);
  if (majorOfferingError) throw majorOfferingError;
  const majorOfferingIds = (majorOfferings ?? []).map((row) => row.id);

  const { data: sectionRows, error: sectionError } = await admin
    .from("section")
    .select("id, code, year_level, classification, student_count, advisory_faculty_id")
    .in("major_offering_id", majorOfferingIds)
    .eq("academic_term_id", scope.academicTermId);
  if (sectionError) throw sectionError;
  const sectionIds = (sectionRows ?? []).map((row) => row.id);

  const { data: utilizationRows, error: utilizationError } = sectionIds.length
    ? await admin
        .from("course_utilization")
        .select(
          `
          class_id,
          course:course_id(code, title, lecture_unit, laboratory_unit),
          section:section_id(id, code, year_level, classification),
          class:class_id(
            code,
            user_class(
              user:user_id(
                id,
                campus:campus_id(code),
                college:college_id(code),
                identity:identity(first_name, middle_name, last_name, suffix, professional_extension)
              )
            )
          )
          `,
        )
        .in("section_id", sectionIds)
    : { data: [], error: null };
  if (utilizationError) throw utilizationError;

  const classIds = Array.from(
    new Set((utilizationRows ?? []).map((row) => row.class_id as string).filter(Boolean)),
  );

  const { data: sessionRows, error: sessionError } = classIds.length
    ? await admin
        .from("session_class")
        .select(
          "class_id, session:session_id(day, start_time, end_time, type, room:room_id(code, name))",
        )
        .in("class_id", classIds)
    : { data: [], error: null };
  if (sessionError) throw sessionError;

  const sessionsByClass = new Map<string, SnapshotSession[]>();
  (sessionRows ?? []).forEach((row) => {
    const session = first(row.session) as {
      day?: string | null;
      start_time?: string | null;
      end_time?: string | null;
      type?: string | null;
      room?: { code?: string | null; name?: string | null } | Array<{ code?: string | null; name?: string | null }>;
    } | null;
    const classId = row.class_id as string | null;
    if (!classId || !session) return;
    const room = first(session.room);
    const list = sessionsByClass.get(classId) ?? [];
    list.push({
      day: session.day ?? "",
      start_time: session.start_time ?? "",
      end_time: session.end_time ?? "",
      type: session.type ?? "",
      room_code: room?.code ?? null,
      room_name: room?.name ?? null,
    });
    sessionsByClass.set(classId, list);
  });

  // Signatories — same designation lookups the app performs.
  const [{ data: campusDirectorRows }, { data: higherUpRows }, { data: chairRows }] =
    await Promise.all([
      admin
        .from("designation")
        .select("job_title, user_id")
        .eq("campus_id", scope.campusId)
        .eq("job_title", "Campus Director"),
      admin
        .from("designation")
        .select("job_title, user_id")
        .in("job_title", ["Director for Instruction", "Vice President for Academic Affairs"]),
      admin
        .from("designation")
        .select("job_title, user_id")
        .eq("job_title", "Program Chairperson")
        .eq("program_offering_id", scope.programOfferingId),
    ]);

  const signatoryRows = [
    ...(campusDirectorRows ?? []),
    ...(higherUpRows ?? []),
    ...(chairRows ?? []),
  ];
  const advisoryFacultyIds = (sectionRows ?? [])
    .map((row) => row.advisory_faculty_id as string | null)
    .filter(Boolean) as string[];
  const identityUserIds = Array.from(
    new Set([
      ...signatoryRows.map((row) => row.user_id).filter(Boolean),
      ...advisoryFacultyIds,
    ]),
  ) as string[];

  const { data: identityRows } = identityUserIds.length
    ? await admin
        .from("identity")
        .select("user_id, first_name, middle_name, last_name, suffix, professional_extension")
        .in("user_id", identityUserIds)
    : { data: [] };
  const identityByUserId = new Map(
    ((identityRows ?? []) as IdentityRow[]).map((row) => [row.user_id, row]),
  );
  const signatoryName = (jobTitle: string): string | null => {
    const row = signatoryRows.find((item) => item.job_title === jobTitle);
    if (!row?.user_id) return null;
    return formatIdentityName(identityByUserId.get(row.user_id) ?? null);
  };
  const programChairName = signatoryName("Program Chairperson");

  // --- class_schedule.classes: one entry per class, with instructor + sessions.
  type ClassEntry = {
    class_id: string;
    class_code: string;
    course_code: string;
    course_title: string;
    section_id: string | null;
    section_code: string | null;
    year_level: string | number | null;
    classification: string | null;
    lecture_unit: number;
    laboratory_unit: number;
    lecture_hours: number;
    laboratory_hours: number;
    instructor_id: string | null;
    instructor_name: string | null;
    instructor_college_code: string | null;
    instructor_campus_code: string | null;
    sessions: SnapshotSession[];
  };

  const classEntries = new Map<string, ClassEntry>();
  (utilizationRows ?? []).forEach((row) => {
    const classId = row.class_id as string | null;
    if (!classId || classEntries.has(classId)) return;

    const course = first(row.course) as {
      code?: string | null;
      title?: string | null;
      lecture_unit?: number | null;
      laboratory_unit?: number | null;
    } | null;
    const section = first(row.section) as {
      id?: string;
      code?: string | null;
      year_level?: string | number | null;
      classification?: string | null;
    } | null;
    const classRow = first(row.class) as { code?: string | null; user_class?: unknown } | null;
    const userClass = first(classRow?.user_class) as { user?: unknown } | null;
    const instructor = first(userClass?.user) as {
      id?: string;
      campus?: { code?: string | null } | Array<{ code?: string | null }>;
      college?: { code?: string | null } | Array<{ code?: string | null }>;
      identity?: IdentityRow | IdentityRow[];
    } | null;

    const sessions = sessionsByClass.get(classId) ?? [];
    const lectureHours = sessions
      .filter((s) => s.type === "Lecture")
      .reduce((sum, s) => sum + durationHours(s.start_time, s.end_time), 0);
    const laboratoryHours = sessions
      .filter((s) => s.type === "Laboratory")
      .reduce((sum, s) => sum + durationHours(s.start_time, s.end_time), 0);
    const lectureUnit = Number(course?.lecture_unit ?? 0);
    const laboratoryUnit = Number(course?.laboratory_unit ?? 0);

    classEntries.set(classId, {
      class_id: classId,
      class_code: classRow?.code ?? "",
      course_code: course?.code ?? "Unknown",
      course_title: course?.title ?? "Untitled Course",
      section_id: section?.id ?? null,
      section_code: section?.code ?? null,
      year_level: section?.year_level ?? null,
      classification: section?.classification ?? null,
      lecture_unit: lectureUnit,
      laboratory_unit: laboratoryUnit,
      lecture_hours: lectureHours > 0 ? lectureHours : lectureUnit,
      laboratory_hours: laboratoryHours > 0 ? laboratoryHours : laboratoryUnit * 3,
      instructor_id: instructor?.id ?? null,
      instructor_name: formatIdentityName(first(instructor?.identity)),
      instructor_college_code: first(instructor?.college)?.code ?? null,
      instructor_campus_code: first(instructor?.campus)?.code ?? null,
      sessions,
    });
  });

  // --- faculty_load.faculty: group classes by instructor.
  const facultyByUserId = new Map<
    string,
    { name: string | null; campusCode: string | null; collegeCode: string | null; classes: ClassEntry[] }
  >();
  classEntries.forEach((entry) => {
    if (!entry.instructor_id) return;
    const existing = facultyByUserId.get(entry.instructor_id) ?? {
      name: entry.instructor_name,
      campusCode: entry.instructor_campus_code,
      collegeCode: entry.instructor_college_code,
      classes: [],
    };
    existing.classes.push(entry);
    facultyByUserId.set(entry.instructor_id, existing);
  });

  const faculty = [...facultyByUserId.entries()].map(([userId, info]) => {
    const classes = info.classes.map((entry) => ({
      id: entry.class_id,
      class_code: entry.class_code,
      course_code: entry.course_code,
      course_title: entry.course_title,
      section_code: entry.section_code,
      student_count: 0,
      lecture_unit: entry.lecture_unit,
      laboratory_unit: entry.laboratory_unit,
      lecture_hours: entry.lecture_hours,
      laboratory_hours: entry.laboratory_hours,
      load: entry.lecture_unit + entry.laboratory_unit,
      sessions: entry.sessions,
    }));
    const lectureHours = classes.reduce((sum, c) => sum + c.lecture_hours, 0);
    const laboratoryHours = classes.reduce((sum, c) => sum + c.laboratory_hours, 0);
    const actualTeachingLoad = classes.reduce((sum, c) => sum + c.load, 0);
    return {
      faculty_id: userId,
      faculty_name: info.name ?? "Unnamed Faculty",
      employment_status: null,
      academic_rank: null,
      college_code: info.collegeCode,
      campus_code: info.campusCode,
      designation_summary: "N/A",
      degrees: { bachelors: null, masters: null, doctorate: null, post_doctorate: null },
      lecture_hours: lectureHours,
      laboratory_hours: laboratoryHours,
      preparation_count: classes.length,
      equivalent_units: 0,
      equivalent_teaching_load: 0,
      actual_teaching_load: actualTeachingLoad,
      total_working_load: actualTeachingLoad,
      advisory_class: null,
      classes,
    };
  });

  const sections = (sectionRows ?? []).map((row) => ({
    section_id: row.id,
    section_code: row.code,
    year_level: row.year_level ?? null,
    classification: row.classification ?? null,
    student_count: (row.student_count as number | null) ?? null,
    adviser_name: row.advisory_faculty_id
      ? formatIdentityName(identityByUserId.get(row.advisory_faculty_id as string) ?? null)
      : null,
    program_chair_name: programChairName,
  }));

  // The local seeds ship no course_utilization/session rows at all, so a
  // purely data-driven fixture would be a few KB — nothing like the JSONB a
  // real submit writes. When the scope has no class data, synthesize a
  // plausible baseline (shaped exactly like the real entries) so the payload
  // still exercises a realistic write cost. Clearly logged by the seeder.
  if (classEntries.size === 0) {
    const sectionsForSynth = (sectionRows ?? []).length
      ? (sectionRows ?? [])
      : [{ id: null, code: "SYNTH 1-A", year_level: 1, classification: null }];
    const synthFacultyCount = 12;
    const classesPerSection = 9;
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    let synthIndex = 0;
    sectionsForSynth.forEach((section) => {
      for (let i = 0; i < classesPerSection; i += 1) {
        synthIndex += 1;
        const facultyIndex = synthIndex % synthFacultyCount;
        const startHour = 7 + (synthIndex % 10);
        const sessions: SnapshotSession[] = [0, 2].map((offset) => ({
          day: days[(synthIndex + offset) % days.length],
          start_time: `${String(startHour).padStart(2, "0")}:00:00`,
          end_time: `${String(startHour + 1).padStart(2, "0")}:30:00`,
          type: i % 3 === 2 ? "Laboratory" : "Lecture",
          room_code: `RM-${100 + (synthIndex % 20)}`,
          room_name: `Synthetic Room ${100 + (synthIndex % 20)}`,
        }));
        classEntries.set(`synthetic-class-${synthIndex}`, {
          class_id: `synthetic-class-${synthIndex}`,
          class_code: `SYN${String(synthIndex).padStart(3, "0")}`,
          course_code: `CS ${100 + synthIndex}`,
          course_title: `Synthetic Course ${synthIndex} — Introduction to Load Testing Payloads`,
          section_id: (section.id as string | null) ?? null,
          section_code: (section.code as string | null) ?? null,
          year_level: (section.year_level as string | number | null) ?? null,
          classification: (section.classification as string | null) ?? null,
          lecture_unit: 3,
          laboratory_unit: i % 3 === 2 ? 1 : 0,
          lecture_hours: 3,
          laboratory_hours: i % 3 === 2 ? 3 : 0,
          instructor_id: `synthetic-faculty-${facultyIndex}`,
          instructor_name: `Facultyname, Synthetic F${facultyIndex}.`,
          instructor_college_code: college?.code ?? "SYN",
          instructor_campus_code: campus?.code ?? "SYN",
          sessions,
        });
      }
    });
    classEntries.forEach((entry) => {
      if (!entry.instructor_id) return;
      const existing = facultyByUserId.get(entry.instructor_id) ?? {
        name: entry.instructor_name,
        campusCode: entry.instructor_campus_code,
        collegeCode: entry.instructor_college_code,
        classes: [],
      };
      existing.classes.push(entry);
      facultyByUserId.set(entry.instructor_id, existing);
    });
    faculty.length = 0;
    facultyByUserId.forEach((info, userId) => {
      const classes = info.classes.map((entry) => ({
        id: entry.class_id,
        class_code: entry.class_code,
        course_code: entry.course_code,
        course_title: entry.course_title,
        section_code: entry.section_code,
        student_count: 35,
        lecture_unit: entry.lecture_unit,
        laboratory_unit: entry.laboratory_unit,
        lecture_hours: entry.lecture_hours,
        laboratory_hours: entry.laboratory_hours,
        load: entry.lecture_unit + entry.laboratory_unit,
        sessions: entry.sessions,
      }));
      const lectureHours = classes.reduce((sum, c) => sum + c.lecture_hours, 0);
      const laboratoryHours = classes.reduce((sum, c) => sum + c.laboratory_hours, 0);
      const actualTeachingLoad = classes.reduce((sum, c) => sum + c.load, 0);
      faculty.push({
        faculty_id: userId,
        faculty_name: info.name ?? "Unnamed Faculty",
        employment_status: null,
        academic_rank: null,
        college_code: info.collegeCode,
        campus_code: info.campusCode,
        designation_summary: "N/A",
        degrees: { bachelors: null, masters: null, doctorate: null, post_doctorate: null },
        lecture_hours: lectureHours,
        laboratory_hours: laboratoryHours,
        preparation_count: classes.length,
        equivalent_units: 0,
        equivalent_teaching_load: 0,
        actual_teaching_load: actualTeachingLoad,
        total_working_load: actualTeachingLoad,
        advisory_class: null,
        classes,
      });
    });
  }

  // Padding knob: duplicate faculty/class entries (with distinct ids) so the
  // serialized fixture can approximate production-scale snapshot sizes even
  // when local seed data is small.
  const multiplier = Math.max(1, Number(process.env.LOAD_TEST_SNAPSHOT_MULTIPLIER ?? "1") || 1);
  const baseClasses = [...classEntries.values()];
  const paddedFaculty = [...faculty];
  const paddedClasses = [...baseClasses];
  for (let copy = 2; copy <= multiplier; copy += 1) {
    faculty.forEach((row) =>
      paddedFaculty.push({
        ...row,
        faculty_id: `${row.faculty_id}-dup${copy}`,
        faculty_name: `${row.faculty_name} (dup ${copy})`,
        classes: row.classes.map((cls) => ({ ...cls, id: `${cls.id}-dup${copy}` })),
      }),
    );
    baseClasses.forEach((row) =>
      paddedClasses.push({ ...row, class_id: `${row.class_id}-dup${copy}` }),
    );
  }

  const facultyTotals = paddedFaculty.reduce(
    (sum, row) => ({
      equivalent_teaching_load: sum.equivalent_teaching_load + row.equivalent_teaching_load,
      lecture_hours: sum.lecture_hours + row.lecture_hours,
      laboratory_hours: sum.laboratory_hours + row.laboratory_hours,
      preparation_count: sum.preparation_count + row.preparation_count,
      equivalent_units: sum.equivalent_units + row.equivalent_units,
      actual_teaching_load: sum.actual_teaching_load + row.actual_teaching_load,
      total_working_load: sum.total_working_load + row.total_working_load,
    }),
    {
      equivalent_teaching_load: 0,
      lecture_hours: 0,
      laboratory_hours: 0,
      preparation_count: 0,
      equivalent_units: 0,
      actual_teaching_load: 0,
      total_working_load: 0,
    },
  );

  const classTotals = paddedClasses.reduce(
    (sum, row) => ({
      class_count: sum.class_count + 1,
      assigned_count: sum.assigned_count + (row.instructor_id ? 1 : 0),
      unassigned_count: sum.unassigned_count + (row.instructor_id ? 0 : 1),
      lecture_hours: sum.lecture_hours + row.lecture_hours,
      laboratory_hours: sum.laboratory_hours + row.laboratory_hours,
    }),
    { class_count: 0, assigned_count: 0, unassigned_count: 0, lecture_hours: 0, laboratory_hours: 0 },
  );

  const academicYear = first(
    (academicTerm as { academic_year?: { code?: string | null } | Array<{ code?: string | null }> } | null)
      ?.academic_year,
  );

  return {
    metadata: {
      campus_id: scope.campusId,
      campus_code: campus?.code ?? null,
      campus_name: campus?.name ?? null,
      college_id: scope.collegeId,
      college_code: college?.code ?? null,
      college_name: college?.name ?? null,
      academic_term_id: scope.academicTermId,
      academic_term_code: academicTerm?.code ?? null,
      academic_term_name: academicTerm?.name ?? null,
      academic_year_code: academicYear?.code ?? null,
      generated_at: new Date().toISOString(),
      prepared_by: signatoryName("Campus Director"),
      recommending_approval: signatoryName("Director for Instruction"),
      approved_by: signatoryName("Vice President for Academic Affairs"),
    },
    faculty_load: {
      faculty: paddedFaculty,
      totals: { faculty_count: paddedFaculty.length, ...facultyTotals },
    },
    class_schedule: {
      classes: paddedClasses,
      sections,
      totals: classTotals,
    },
  };
};
