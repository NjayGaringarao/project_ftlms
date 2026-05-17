// ── Shared base for class rows in both perspectives ──

export type CourseLoadingClassRow = {
  id: string;
  class_code: string;
  course_id: string;
  course_code: string;
  course_title: string;
  lecture_unit: number;
  laboratory_unit: number;
};

// ── Faculty-aware class row ──

export type FacultyClassSection = {
  course_utilization_id: string;
  section_id: string;
  section_code: string;
  classification: "regular" | "irregular";
  program_code: string;
  major_code: string;
  year_level: number;
  name: string;
  student_count: number;
};

export type FacultyClassRow = CourseLoadingClassRow & {
  campus_id: string;
  campus_code: string;
  campus_name: string;
  sections: FacultyClassSection[];
  merged_section_label: string;
  student_count: number;
  /** ATL = lecture_unit + (laboratory_unit × 3) × 0.75 */
  atl: number;
};

// ── Section-aware class row ──

export type SectionClassMergedWith = {
  section_id: string;
  section_code: string;
  classification: "regular" | "irregular";
};

export type SectionClassRow = CourseLoadingClassRow & {
  course_utilization_id: string;
  faculty_id: string | null;
  faculty_name: string | null;
  /** laboratory_unit × 3 (contact hours) */
  laboratory_hours: number;
  /** lecture_unit (contact hours) */
  lecture_hours: number;
  /** laboratory_unit + lecture_unit */
  unit: number;
  merged_with: SectionClassMergedWith[];
  has_sessions: boolean;
  unscheduled_lecture_hours: number;
  unscheduled_laboratory_hours: number;
};

// ── Sidebar list items ──

export type FacultyListItem = {
  id: string;
  name: string;
  latest_degree_title: string | null;
  total_working_load: number;
  campus_id: string | null;
  campus_code: string | null;
  campus_name: string | null;
  college_id: string | null;
  college_code: string | null;
  college_name: string | null;
};

export type CourseLoadingSectionListItem = {
  id: string;
  code: string;
  classification: "regular" | "irregular";
  program_offering_code: string;
  program_offering_id?: string;
  program_code?: string;
  program_name?: string;
  college_id?: string | null;
  campus_id: string;
  campus_code: string;
  campus_name: string;
  year_level: number;
  total_unit: number;
  student_count: number;
};

// ── Action inputs ──

export type ClassInsertInput = {
  academic_term_id: string;
  faculty_id: string;
  course_id: string;
  section_ids: string[];
};

export type ClassUpdateInput = {
  class_id: string;
  academic_term_id: string;
  faculty_id?: string;
  course_id?: string;
  section_ids?: string[];
};
