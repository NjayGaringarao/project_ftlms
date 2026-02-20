import { User } from "./user";

export type Campus = {
  id: string;
  director_id: string | null;
  name: string;
  address: string | null;
  zip_code: string | null;
};

export type ExtendedCampus = Campus & {
  director: User | null;
};
