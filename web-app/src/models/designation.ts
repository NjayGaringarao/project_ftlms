import { Campus } from "./campus";
import { Department } from "./department";
import { User } from "./user";

export type Designation = {
  id: string;
  user_id: string;
  campus_id: string | null;
  position: string;
  department_id: string | null;
  load: number | null;
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
