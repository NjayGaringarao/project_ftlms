import { FTLBootstrapData, FTLFaculty } from "@/lib/ftl/types";
import { DAY_OPTIONS } from "./constants";

export const toTimeInput = (value: string) => value.slice(0, 5);

export const toDisplayTime = (value: string) => {
  const [hourRaw, minuteRaw] = toTimeInput(value).split(":");
  const hour24 = Number(hourRaw ?? 0);
  const minute = Number(minuteRaw ?? 0);
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;
};

export const toMinutes = (value: string) => {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw ?? 0);
  const minute = Number(minuteRaw ?? 0);
  return hour * 60 + minute;
};

export const sessionDurationHours = (start: string, end: string) => {
  const minutes = toMinutes(end) - toMinutes(start);
  if (minutes <= 0) return 0;
  return minutes / 60;
};

export const dayLabel = (value: string) =>
  DAY_OPTIONS.find((day) => day.value === value)?.label ?? `Day ${value}`;

export const fullName = (faculty: FTLFaculty | null) => {
  if (!faculty) return "";

  const parts = [faculty.first_name, faculty.middle_name, faculty.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (!parts) return "Unknown Faculty";
  return faculty.extension ? `${parts}, ${faculty.extension}` : parts;
};

export const formatTermLabel = (term: FTLBootstrapData["terms"][number]) => {
  return `${term.code} • AY ${term.academic_year_start}-${term.academic_year_end} • ${term.term_order}`;
};
