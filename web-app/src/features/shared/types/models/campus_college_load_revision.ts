import { CampusCollegeLoad } from "./campus_college_load";
import { Designation } from "./designation";
import { User } from "./user";

export type CampusCollegeLoadSnapshotFacultyClass = {
  id: string;
  class_code: string;
  course_code: string;
  course_title: string;
  year_section: string;
  lecture_unit: number;
  laboratory_unit: number;
  lecture_hours?: number;
  laboratory_hours?: number;
  load: number;
};

export type CampusCollegeLoadSnapshotFaculty = {
  faculty_id: string;
  faculty_name: string;
  employment_status: string | null;
  academic_rank: string | null;
  college_code: string | null;
  campus_code: string | null;
  designation_summary?: string | null;
  lecture_hours?: number;
  laboratory_hours?: number;
  preparation_count?: number;
  equivalent_units?: number;
  equivalent_teaching_load: number;
  actual_teaching_load: number;
  total_working_load: number;
  classes: CampusCollegeLoadSnapshotFacultyClass[];
};

export type CampusCollegeLoadSnapshotTotals = {
  faculty_count: number;
  lecture_hours?: number;
  laboratory_hours?: number;
  preparation_count?: number;
  equivalent_units?: number;
  equivalent_teaching_load: number;
  actual_teaching_load: number;
  total_working_load: number;
};

export type CampusCollegeLoadSnapshotSession = {
  day: string;
  start_time: string;
  end_time: string;
  type: string;
  room_code: string | null;
  room_name: string | null;
};

export type CampusCollegeLoadSnapshotClass = {
  class_id: string;
  class_code: string;
  course_code: string;
  course_title: string;
  section_id: string | null;
  section_code: string | null;
  year_level: number | null;
  classification: string | null;
  lecture_unit: number;
  laboratory_unit: number;
  lecture_hours: number;
  laboratory_hours: number;
  instructor_id: string | null;
  instructor_name: string | null;
  instructor_college_code?: string | null;
  instructor_campus_code?: string | null;
  sessions: CampusCollegeLoadSnapshotSession[];
};

export type CampusCollegeLoadSnapshotClassTotals = {
  class_count: number;
  assigned_count: number;
  unassigned_count: number;
  lecture_hours: number;
  laboratory_hours: number;
};

/**
 * Every section in scope for this campus-college, independent of whether any
 * subject/class has actually been assigned to it yet — sourced directly from
 * the `section` table, not derived from `class_schedule.classes`, so a
 * section with zero classes still shows up.
 */
export type CampusCollegeLoadSnapshotSection = {
  section_id: string;
  section_code: string;
  year_level: number | null;
  classification: string | null;
};

export type CampusCollegeLoadSnapshotMetadata = {
  campus_id: string;
  campus_code: string | null;
  campus_name: string | null;
  college_id: string;
  college_code: string | null;
  college_name: string | null;
  academic_term_id: string;
  academic_term_code?: string | null;
  academic_term_name?: string | null;
  academic_year_code?: string | null;
  generated_at: string;
};

export type CampusCollegeLoadSnapshot = {
  metadata: CampusCollegeLoadSnapshotMetadata;
  faculty_load: {
    faculty: CampusCollegeLoadSnapshotFaculty[];
    totals: CampusCollegeLoadSnapshotTotals;
  };
  class_schedule: {
    classes: CampusCollegeLoadSnapshotClass[];
    sections: CampusCollegeLoadSnapshotSection[];
    totals: CampusCollegeLoadSnapshotClassTotals;
  };
};

/**
 * Pre-restructure snapshot shape (no `metadata`/`class_schedule` wrapper):
 * identity fields and `faculty`/`totals` were top-level siblings, and each
 * faculty's `classes` were already filtered down to the campus-college scope
 * rather than holding the faculty's full load.
 */
export type LegacyCampusCollegeLoadSnapshot = {
  campus_id: string;
  campus_code: string | null;
  campus_name: string | null;
  college_id: string;
  college_code: string | null;
  college_name: string | null;
  academic_term_id: string;
  academic_term_code?: string | null;
  academic_term_name?: string | null;
  academic_year_code?: string | null;
  generated_at: string;
  faculty: CampusCollegeLoadSnapshotFaculty[];
  totals: CampusCollegeLoadSnapshotTotals;
};

export type NormalizedCampusCollegeLoadSnapshot = CampusCollegeLoadSnapshot & {
  legacy: boolean;
};

export const isLegacyCampusCollegeLoadSnapshot = (
  value: unknown,
): value is LegacyCampusCollegeLoadSnapshot => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    !("metadata" in record) &&
    "faculty" in record &&
    "campus_id" in record
  );
};

const emptyClassTotals: CampusCollegeLoadSnapshotClassTotals = {
  class_count: 0,
  assigned_count: 0,
  unassigned_count: 0,
  lecture_hours: 0,
  laboratory_hours: 0,
};

/**
 * Normalizes either the current or legacy snapshot shape into the canonical
 * `CampusCollegeLoadSnapshot`. UI code must always read snapshots through this
 * helper rather than touching `revision.snapshot` directly, since revisions
 * frozen before the faculty_load/class_schedule split don't carry `metadata`
 * or `class_schedule` data.
 */
export const normalizeCampusCollegeLoadSnapshot = (
  raw: unknown,
): NormalizedCampusCollegeLoadSnapshot | null => {
  if (!raw || typeof raw !== "object") return null;

  if (isLegacyCampusCollegeLoadSnapshot(raw)) {
    return {
      legacy: true,
      metadata: {
        campus_id: raw.campus_id,
        campus_code: raw.campus_code,
        campus_name: raw.campus_name,
        college_id: raw.college_id,
        college_code: raw.college_code,
        college_name: raw.college_name,
        academic_term_id: raw.academic_term_id,
        academic_term_code: raw.academic_term_code,
        academic_term_name: raw.academic_term_name,
        academic_year_code: raw.academic_year_code,
        generated_at: raw.generated_at,
      },
      faculty_load: { faculty: raw.faculty, totals: raw.totals },
      class_schedule: { classes: [], sections: [], totals: emptyClassTotals },
    };
  }

  const snapshot = raw as CampusCollegeLoadSnapshot;
  if (!snapshot.metadata || !snapshot.faculty_load || !snapshot.class_schedule) {
    return null;
  }

  return {
    ...snapshot,
    legacy: false,
    class_schedule: {
      ...snapshot.class_schedule,
      classes: snapshot.class_schedule.classes.map((classRow) => ({
        ...classRow,
        section_id: classRow.section_id ?? null,
        year_level: classRow.year_level ?? null,
        classification: classRow.classification ?? null,
        sessions: Array.isArray(classRow.sessions) ? classRow.sessions : [],
      })),
      sections: Array.isArray(snapshot.class_schedule.sections)
        ? snapshot.class_schedule.sections
        : [],
    },
  };
};

export type CampusCollegeLoadRevision = {
  id: string;
  campus_college_load_id: string;
  revision_number: number;
  snapshot: CampusCollegeLoadSnapshot;
  submitted_by_user_id: string;
  submitted_by_designation_id: string | null;
  submitted_by_name?: string | null;
  submitted_at: string | null;
};

export type ExtendedCampusCollegeLoadRevision = CampusCollegeLoadRevision & {
  campus_college_load: CampusCollegeLoad;
  submitted_by_user: User;
  submitted_by_designation: Designation | null;
};
