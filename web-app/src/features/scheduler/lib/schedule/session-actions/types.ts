import type { SessionDay, SessionType } from "@/features/shared/types/models";

export type MutationError = { message?: string };

export type ClassContext = {
  classId: string;
  userId: string | null;
  academicTermId: string;
  blockIds: string[];
};

export type SessionContext = {
  sessionId: string;
  classId: string;
  facultyId: string;
  academicTermId: string;
  blockIds: string[];
  day: SessionDay;
  start_time: string;
  end_time: string;
};

export type RawSessionRow = {
  id: string;
  code?: string | null;
  day?: SessionDay | null;
  start_time?: string | null;
  end_time?: string | null;
  type?: SessionType | null;
  room_id?: string | null;
  room?:
    | {
        id?: string | null;
        code?: string | null;
        name?: string | null;
      }
    | Array<{
        id?: string | null;
        code?: string | null;
        name?: string | null;
      }>
    | null;
};

export type RawIdentityRow = { name?: string | null };
export type RawRankRow = { code?: string | null; title?: string | null };
export type RawDegreeRow = {
  title?: string | null;
  academic_level?: string | null;
  year_graduated?: number | null;
};

export type RawProgramRow = {
  code?: string | null;
  name?: string | null;
  college_id?: string | null;
};

export type RawCampusRow = {
  id?: string | null;
  name?: string | null;
  address?: string | null;
};

export type RawProgramOfferingRow = {
  program?: RawProgramRow | RawProgramRow[] | null;
  campus_id?: string | null;
  campus?: RawCampusRow | RawCampusRow[] | null;
};

export type RawMajorRow = { code?: string | null; name?: string | null };

export type RawMajorOfferingRow = {
  major?: RawMajorRow | RawMajorRow[] | null;
  program_offering?: RawProgramOfferingRow | RawProgramOfferingRow[] | null;
};

export type RawBlockRow = {
  id?: string;
  code?: string | null;
  year_level?: number | null;
  section?: string | null;
  student_count?: number | null;
  academic_term_id?: string | null;
  major_offering?: RawMajorOfferingRow | RawMajorOfferingRow[] | null;
};

export type RawCourseRow = {
  id?: string;
  code?: string | null;
  title?: string | null;
  lecture_unit?: number | null;
  laboratory_unit?: number | null;
};

export type RawClassDetailsRow = {
  id: string;
  code?: string | null;
  user_class?:
    | Array<{
        user?:
          | {
              id?: string;
              identity?: RawIdentityRow | RawIdentityRow[] | null;
              rank?: RawRankRow | RawRankRow[] | null;
              degree?: RawDegreeRow[] | null;
            }
          | Array<{
              id?: string;
              identity?: RawIdentityRow | RawIdentityRow[] | null;
              rank?: RawRankRow | RawRankRow[] | null;
              degree?: RawDegreeRow[] | null;
            }>
          | null;
      }>
    | null;
  course_utilization?:
    | Array<{
        course?: RawCourseRow | RawCourseRow[] | null;
        block?: RawBlockRow | RawBlockRow[] | null;
      }>
    | null;
};

export type RawRoomRow = {
  id: string;
  code: string;
  name?: string | null;
  capacity?: number | null;
  campus_id?: string;
  campus?:
    | { id?: string; code?: string | null; name?: string | null }
    | Array<{ id?: string; code?: string | null; name?: string | null }>
    | null;
};

export type SchedulerDialogSession = {
  id: string;
  code: string;
  day: SessionDay;
  start_time: string;
  end_time: string;
  type: SessionType;
  room_id: string | null;
  room_code: string | null;
  room_name: string | null;
};

export type SchedulerDialogRoom = {
  id: string;
  code: string;
  name: string;
  capacity: number | null;
  campus_id: string;
  campus_name: string | null;
};

export type SchedulerDialogBlock = {
  id: string;
  code: string;
  year_level: number | null;
  section: string | null;
  student_count: number | null;
  program_name: string | null;
  major_name: string | null;
  campus_id: string | null;
  campus_name: string | null;
  campus_address: string | null;
};

export type SchedulerDialogDetails = {
  class_id: string;
  class_code: string;
  academic_term_id: string;
  faculty_id: string;
  faculty_name: string;
  faculty_rank: string | null;
  faculty_degrees: string[];
  course_code: string;
  course_title: string;
  lecture_unit: number;
  laboratory_unit: number;
  total_hours: number;
  unscheduled_lecture_hours: number;
  unscheduled_laboratory_hours: number;
  blocks: SchedulerDialogBlock[];
  rooms: SchedulerDialogRoom[];
  sessions: SchedulerDialogSession[];
};

export type SessionConflictWindow = {
  start_time: string;
  end_time: string;
  reason: string;
};

export type SessionSummary = {
  session_id: string;
  class_id: string;
  class_code: string;
  course_code: string | null;
  course_title: string | null;
  faculty_id: string | null;
  faculty_name: string | null;
  room_id: string | null;
  room_code: string | null;
  room_name: string | null;
  campus_id: string | null;
  college_id: string | null;
  day: SessionDay;
  start_time: string;
  end_time: string;
  type: SessionType;
  block_codes: string[];
};

export type SessionRoomOption = {
  id: string;
  code: string;
  name: string;
  campus_name: string | null;
  campus_id: string | null;
  campus_code: string | null;
  capacity: number | null;
};

export type CreateClassSessionInput = {
  classId: string;
  type: SessionType;
  roomId: string | null;
  day: SessionDay;
  startTime: string;
  endTime: string;
  facultyId?: string | null;
};

export type CreateSessionFromOfferingInput = {
  academicTermId: string;
  blockId: string;
  courseUtilizationId: string;
  facultyId: string;
  roomId: string | null;
  day: SessionDay;
  startTime: string;
  endTime: string;
  type: SessionType;
};
