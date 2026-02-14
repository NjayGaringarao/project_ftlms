import { Campus } from "./campus";
import { User } from "./user";

export type Designation = {
  id: string;
  user_id: string;
  campus_id: string | null;
  position: string;
  department: string | null;
  load: number | null;
};

export type ExtendedDesignation = Designation & {
  user: User;
  campus: Campus | null;
};

export type DesignationWithCampus = Designation & {
  campus: Pick<Campus, "id" | "name"> | null;
};
