import { User } from "./user";

export type Campus = {
  id: string;
  director_id: string;
  name: string;
  address: string;
  zip_code: string;
};

export type ExtendedCampus = Campus & {
  director: User;
};
