import { Class } from "./class";
import { Room } from "./room";

export type SessionDay =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";
export type SessionType = "Lecture" | "Laboratory";
export type Session = {
  id: string;
  class_id: string;
  room_id: string | null;
  day: SessionDay;
  start_time: string;
  end_time: string;
  type: SessionType;
};

export type ExtendedSession = Session & {
  class: Class;
  room: Room | null;
};
