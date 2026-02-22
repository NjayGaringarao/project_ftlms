import { Class } from "./class";
import { Room } from "./room";

export type Session = {
  id: string;
  class_id: string;
  room_id: string | null;
  day: number;
  start_time: string;
  end_time: string;
};

export type ExtendedSession = Session & {
  class: Class;
  room: Room | null;
};
