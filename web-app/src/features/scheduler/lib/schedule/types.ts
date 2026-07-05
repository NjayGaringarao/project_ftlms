import { ExtendedAcademicTerm, SessionDay, SessionType } from "@/features/shared/types/models";

export const ACADEMIC_TERM_QUERY_PARAM = "academic-term_id";

export type ScheduleAcademicTermOption = ExtendedAcademicTerm & {
  is_active: boolean;
};

export type FacultyTeachingLoadRow = {
  class_id: string;
  course_code: string;
  course_title: string;
  lecture_hour: number;
  laboratory_hour: number;
  load: number;
  sections: string[];
  merged_section_label: string;
  campus_label: string;
};

export type FacultyScheduleSessionInfo = {
  id: string;
  day: SessionDay;
  start_time: string;
  end_time: string;
  type: SessionType;
  room_id: string | null;
  room_code: string | null;
  room_name: string | null;
};

export type FacultyScheduleRow = {
  row_id: string;
  class_id: string;
  primary_section_id: string | null;
  primary_course_utilization_id: string | null;
  course_code: string;
  course_title: string;
  section_codes_label: string;
  student_count: number | null;
  lecture_hours: number | null;
  lecture_room: string | null;
  laboratory_hours: number | null;
  laboratory_room: string | null;
  session_days: SessionDay[];
  session: FacultyScheduleSessionInfo | null;
};

export type FacultySchedulePageData = {
  terms: ScheduleAcademicTermOption[];
  selected_term_id: string | null;
  selected_term: ScheduleAcademicTermOption | null;
  has_schedule: boolean;
  teaching_load_rows: FacultyTeachingLoadRow[];
  schedule_rows: FacultyScheduleRow[];
  total_teaching_load: number;
  ftl_available: boolean;
};

export type FacultyScheduleTermSnapshot = Pick<
  FacultySchedulePageData,
  "has_schedule" | "teaching_load_rows" | "schedule_rows" | "total_teaching_load"
>;
