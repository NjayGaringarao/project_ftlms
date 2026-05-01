import { Campus } from "./campus";

export type Room = {
  id: string;
  code: string;
  campus_id: string;
  name: string | null;
  capacity: number | null;
};

export type ExtendedRoom = Room & {
  campus: Campus;
};
