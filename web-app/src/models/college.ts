import { Campus } from "./campus";
import { Department } from "./department";

export type College = {
  id: string;
  department_id: string | null;
  campus_id: string | null;
  description: string | null;
};

export type ExtendedCollege = College & {
  department: Department | null;
  campus: Campus | null;
};
