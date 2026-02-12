import { Campus } from "./campus";
import { User } from "./user";

export type Room = {
  id: string;
  campus_id: string;
  custodian_id: string;
  code: string;
  name: string;
};

export type ExtendedRoom = Room & {
  campus: Campus;
  custodian: User;
};
