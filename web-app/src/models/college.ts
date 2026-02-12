import { Campus } from "./campus";
import { Department } from "./department";

export type College = {
  id: string;
  department_id: string;
  campus_id: string;
  description: string;
};

export type ExtendedCollege = College & {
  department: Department;
  campus: Campus;
};
