import { Campus } from "./campus";
import { College } from "./college";
import { ProgramOffering } from "./program-offering";
import { Program } from "./program";
import { User } from "./user";

// Designation workflow types based on role category.
export type DesignationWorkflow =
  | "academic"
  | "administrative"
  | "student_services"
  | "extension_services";

// Academic workflow job titles
export type AcademicJobTitle = "Program Chairperson" | "College Dean";

// Administrative workflow job titles
export type AdministrativeJobTitle =
  | "University President"
  | "Director for Instruction"
  | "Campus Director";

// Student Services workflow job titles
export type StudentServicesJobTitle = "Coordinator" | "Director";

// Extension Services allows free text
export type ExtensionServicesJobTitle = string;

// All valid job titles (union of specific types)
export type DesignationJobTitle =
  | AcademicJobTitle
  | AdministrativeJobTitle
  | StudentServicesJobTitle
  | ExtensionServicesJobTitle;

export type Designation = {
  id: string;
  user_id: string;
  campus_id: string | null;
  college_id: string | null;
  program_offering_id: string | null;
  room_id: string | null;
  job_title: string;
  position?: string;
  load: number | null;
  designated_at: string;
};

export type ExtendedDesignation = Designation & {
  user: User;
  campus: Campus | null;
  college: College | null;
  program: Program | null;
  program_offering: ProgramOffering | null;
};
