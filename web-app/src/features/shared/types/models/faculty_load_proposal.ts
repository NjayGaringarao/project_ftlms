import { AcademicTerm } from "./academic_term";
import { Campus } from "./campus";
import { Designation } from "./designation";
import { SessionDay, SessionType } from "./session";
import { User, EmploymentStatus } from "./user";

export type ProposalLifecycleStatus =
  | "ACTIVE"
  | "APPROVED"
  | "REJECTED"
  | "INVALIDATED";

export type ProposalDegreeItem = {
  title: string;
  year_graduated: number | null;
};

export type ProposalDesignationItem = {
  job_title: string;
  campus_code: string | null;
  college_code: string | null;
  program_offering_code: string | null;
};

export type ProposalScheduleSessionItem = {
  session_id: string;
  class_id: string;
  course_utilization_id: string;
  course_code: string;
  course_title: string;
  day: SessionDay;
  start_time: string;
  end_time: string;
  type: SessionType;
  room_id: string | null;
  room_code: string | null;
  room_name: string | null;
  section_id: string;
  section_code: string;
  section_classification: "regular" | "irregular";
  year_level: number;
  name: string;
  student_count: number | null;
};

export type FacultyLoadProposal = {
  id: string;
  user_id: string;
  campus_id: string;
  academic_term_id: string;
  employment_status: EmploymentStatus;
  academic_rank: string | null;
  bachelors_degree: ProposalDegreeItem[];
  masters_degree: ProposalDegreeItem[];
  doctorate_degree: ProposalDegreeItem[];
  designations: ProposalDesignationItem[];
  schedule_sessions: ProposalScheduleSessionItem[];
  equivalent_teaching_load: number | null;
  total_lecture_hours: number | null;
  total_lab_hours: number | null;
  preparation_count: number | null;
  actual_teaching_load: number | null;
  advisory_class: string | null;
  lifecycle_status: ProposalLifecycleStatus;
  invalidated_reason: string | null;
  created_by_user_id: string | null;
  created_by_designation_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ExtendedFacultyLoadProposal = FacultyLoadProposal & {
  user: User;
  campus: Campus;
  academic_term: AcademicTerm;
  created_by_user: User | null;
  created_by_designation: Designation | null;
};
