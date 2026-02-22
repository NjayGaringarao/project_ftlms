import { Campus } from "./campus";

export type Room = {
  id: string;
  campus_id: string;
  code: string;
  name: string | null;
};

export type ExtendedRoom = Room & {
  campus: Campus;
};
