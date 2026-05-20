import { CampusCollegeLoad } from "./campus_college_load";
import { Designation } from "./designation";
import { User } from "./user";

export type CampusCollegeLoadSnapshotFaculty = {
  faculty_id: string;
  faculty_name: string;
  employment_status: string | null;
  academic_rank: string | null;
  college_code: string | null;
  campus_code: string | null;
  equivalent_teaching_load: number;
  actual_teaching_load: number;
  total_working_load: number;
  classes: Array<{
    id: string;
    class_code: string;
    course_code: string;
    course_title: string;
    year_section: string;
    lecture_unit: number;
    laboratory_unit: number;
    load: number;
  }>;
};

export type CampusCollegeLoadSnapshot = {
  campus_id: string;
  campus_code: string | null;
  campus_name: string | null;
  college_id: string;
  college_code: string | null;
  college_name: string | null;
  academic_term_id: string;
  generated_at: string;
  faculty: CampusCollegeLoadSnapshotFaculty[];
  totals: {
    faculty_count: number;
    equivalent_teaching_load: number;
    actual_teaching_load: number;
    total_working_load: number;
  };
};

export type CampusCollegeLoadRevision = {
  id: string;
  campus_college_load_id: string;
  revision_number: number;
  snapshot: CampusCollegeLoadSnapshot;
  submitted_by_user_id: string;
  submitted_by_designation_id: string | null;
  submitted_at: string | null;
};

export type ExtendedCampusCollegeLoadRevision = CampusCollegeLoadRevision & {
  campus_college_load: CampusCollegeLoad;
  submitted_by_user: User;
  submitted_by_designation: Designation | null;
};
