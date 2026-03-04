import { ConflictType } from "@/lib/ftl/types";

export const DAY_OPTIONS = [
  { value: "SUNDAY", label: "Sun" },
  { value: "MONDAY", label: "Mon" },
  { value: "TUESDAY", label: "Tue" },
  { value: "WEDNESDAY", label: "Wed" },
  { value: "THURSDAY", label: "Thu" },
  { value: "FRIDAY", label: "Fri" },
  { value: "SATURDAY", label: "Sat  " },
] as const;

export const typeLabelMap: Record<ConflictType, string> = {
  FACULTY: "Faculty double-booked",
  ROOM: "Room occupied",
  BLOCK: "Block overlap",
};
