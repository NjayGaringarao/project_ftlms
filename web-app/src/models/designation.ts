import { Campus } from "./campus";
import { Department } from "./department";
import { User } from "./user";

export type Designation = {
  id: string;
  user_id: string;
  campus_id: string | null;
  department_id: string | null;
  program_id: string | null;
  room_id: string | null;
  job_title: string;
  position?: string;
  load: number | null;
  is_active: boolean;
  designated_at: string;
};

export type ExtendedDesignation = Designation & {
  user: User;
  campus: Campus | null;
  department: Department | null;
};

export type DesignationWithCampus = Designation & {
  campus: Pick<Campus, "id" | "name"> | null;
  department: Pick<Department, "id" | "code" | "name" | "type"> | null;
};
