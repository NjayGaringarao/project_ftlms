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

export type FacultyClassBlock = {
  course_utilization_id: string;
  block_id: string;
  block_code: string;
  program_code: string;
  major_code: string;
  year_level: number;
  section: string;
  student_count: number;
};

export type FacultyClassRow = CourseLoadingClassRow & {
  campus_id: string;
  campus_code: string;
  campus_name: string;
  blocks: FacultyClassBlock[];
  merged_block_label: string;
  student_count: number;
  /** ATL = lecture_unit + laboratory_unit × 0.75 */
  atl: number;
};

// ── Block-aware class row ──

export type BlockClassMergedWith = {
  block_id: string;
  block_code: string;
};

export type BlockClassRow = CourseLoadingClassRow & {
  course_utilization_id: string;
  faculty_id: string | null;
  faculty_name: string | null;
  /** laboratory_unit × 3 (contact hours) */
  laboratory_hours: number;
  /** lecture_unit (contact hours) */
  lecture_hours: number;
  /** laboratory_unit + lecture_unit */
  unit: number;
  merged_with: BlockClassMergedWith[];
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

export type CourseLoadingBlockListItem = {
  id: string;
  code: string;
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
  block_ids: string[];
};

export type ClassUpdateInput = {
  class_id: string;
  academic_term_id: string;
  faculty_id?: string;
  course_id?: string;
  block_ids?: string[];
};
