import { FTLSession } from "@/lib/ftl/types";

export type SessionDraft = {
  class_delivery_id: string;
  block_ids: string[];
  session_id?: string;
  room_id: string;
  day:
    | "SUNDAY"
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY";
  start_time: string;
  end_time: string;
};

export type SessionTableRow = {
  row_id: string;
  class_delivery_id: string;
  course_label: string;
  major_label: string;
  block_label: string;
  remaining_hours: number;
  has_session: boolean;
  session?: FTLSession;
};

export type ConfirmDialogState = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive" | "outline" | "secondary";
  onConfirm: () => void | Promise<void>;
};
