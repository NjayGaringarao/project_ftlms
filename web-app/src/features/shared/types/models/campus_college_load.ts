import { AcademicTerm } from "./academic_term";
import { Campus } from "./campus";
import { College } from "./college";
import { Designation } from "./designation";
import { User } from "./user";

export type CampusCollegeLoadStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "RETURNED"
  | "APPROVED";

export type CampusCollegeLoadStep =
  | "PROGRAM_CHAIR"
  | "CAMPUS_DIRECTOR"
  | "DIRECTOR_FOR_INSTRUCTION"
  | "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS"
  | "COMPLETED";

export type CampusCollegeLoad = {
  id: string;
  campus_id: string;
  college_id: string;
  academic_term_id: string;
  status: CampusCollegeLoadStatus;
  current_step: CampusCollegeLoadStep;
  created_by_user_id: string | null;
  created_by_designation_id: string | null;
  updated_by_user_id: string | null;
  updated_by_designation_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ExtendedCampusCollegeLoad = CampusCollegeLoad & {
  campus: Campus;
  college: College;
  academic_term: AcademicTerm;
  created_by_user: User | null;
  created_by_designation: Designation | null;
};
