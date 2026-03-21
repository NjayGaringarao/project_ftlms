import { Class } from "./class";
import { Session } from "./session";

export type SessionClass = {
  id: string;
  class_id: string;
  session_id: string;
  created_at?: string | null;
};

export type ExtendedSessionClass = SessionClass & {
  class: Class;
  session: Session;
};
