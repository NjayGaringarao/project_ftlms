export type ScheduleState = "APPROVED" | "PENDING" | "REJECTED" | "NONE";

export type FTLBootstrapData = {
  terms: {
    id: string;
    code: string;
    academic_year_start: number;
    academic_year_end: number;
    term_order: string;
    type: string;
    start: string;
    end: string;
  }[];
  campuses: {
    id: string;
    name: string;
  }[];
};

export type FTLOffering = {
  course_c_t_id: string;
  course_id: string;
  course_code: string;
  course_title: string;
  lecture_hour: number | null;
  laboratory_hour: number | null;
  curriculum_id: string;
  curriculum_title: string;
  curriculum_series_year: number;
  curriculum_revised_year: number | null;
  major_code: string | null;
  major_name: string | null;
  program_code: string | null;
  program_name: string | null;
  available_blocks: {
    id: string;
    year_level: number;
    section: string;
    student_count: number | null;
  }[];
};

export type FTLFaculty = {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  extension: string | null;
  employment_status: string;
  total_designation_load: number;
};

export type FTLRoom = {
  id: string;
  campus_id: string;
  code: string;
  name: string | null;
};

export type FTLSession = {
  id: string;
  class_id: string;
  room_id: string | null;
  room_code: string | null;
  room_name: string | null;
  day: number;
  start_time: string;
  end_time: string;
  last_conflict_count: number;
};

export type FTLClass = {
  id: string;
  schedule_id: string;
  course_c_t_id: string;
  block_id: string | null;
  course_code: string;
  course_title: string;
  curriculum_title: string;
  major_code: string | null;
  major_name: string | null;
  year_section: string | null;
  sessions: FTLSession[];
};

export type FTLScheduleBundle = {
  schedule: {
    id: string;
    user_id: string;
    academic_term_id: string;
    updated_at: string | null;
    state: ScheduleState;
  } | null;
  classes: FTLClass[];
};

export type ConflictType = "FACULTY" | "ROOM" | "BLOCK";

export type SessionConflict = {
  type: ConflictType;
  severity: "HIGH" | "MEDIUM";
  message: string;
  conflicting_session_id: string;
  conflicting_schedule_id: string;
  conflicting_schedule_state: ScheduleState;
  conflicting_course_code: string;
  conflicting_course_title: string;
  conflicting_faculty_name: string;
  conflicting_room_code: string | null;
  conflicting_block: string | null;
  day: number;
  start_time: string;
  end_time: string;
};

export type SaveSessionInput = {
  session_id?: string;
  class_id: string;
  schedule_id: string;
  academic_term_id: string;
  campus_id: string;
  faculty_user_id: string;
  block_id: string | null;
  room_id: string | null;
  day: number;
  start_time: string;
  end_time: string;
  expected_schedule_updated_at: string | null;
  save_anyway?: boolean;
  force_stale_save?: boolean;
};

export type SaveSessionResult = {
  session: FTLSession | null;
  conflicts: SessionConflict[];
  stale_error: string | null;
  needs_conflict_confirmation: boolean;
  error: string | null;
};

export type MutationResult = {
  error: string | null;
};
