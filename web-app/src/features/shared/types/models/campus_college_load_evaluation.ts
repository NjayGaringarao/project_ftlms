import { CampusCollegeLoadRevision } from "./campus_college_load_revision";
import { Designation } from "./designation";
import { User } from "./user";

export type CampusCollegeLoadEvaluationStep =
  | "CAMPUS_DIRECTOR"
  | "DIRECTOR_FOR_INSTRUCTION"
  | "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS";

export type CampusCollegeLoadEvaluationStatus = "APPROVED" | "RETURNED";

export type CampusCollegeLoadEvaluation = {
  id: string;
  campus_college_load_revision_id: string;
  step: CampusCollegeLoadEvaluationStep;
  designation_id: string | null;
  evaluator_user_id: string | null;
  status: CampusCollegeLoadEvaluationStatus;
  comment: string | null;
  attachment_bucket: string | null;
  attachment_path: string | null;
  attachment_file_name: string | null;
  attachment_mime_type: string | null;
  created_at: string | null;
};

export type ExtendedCampusCollegeLoadEvaluation =
  CampusCollegeLoadEvaluation & {
    campus_college_load_revision: CampusCollegeLoadRevision;
    designation: Designation | null;
    evaluator: User | null;
  };
