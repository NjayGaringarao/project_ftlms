import {
  FacultyScheduleRow,
  FacultyScheduleSessionInfo,
  ScheduleAcademicTermOption,
} from "./types";

const DAY_ORDER: Record<string, number> = {
  SUNDAY: 1,
  MONDAY: 2,
  TUESDAY: 3,
  WEDNESDAY: 4,
  THURSDAY: 5,
  FRIDAY: 6,
  SATURDAY: 7,
};

export const formatTermLabel = (term: ScheduleAcademicTermOption): string => {
  return `${term.code} | AY ${term.academic_year_start}-${term.academic_year_end}`;
};

export const dayLabel = (value: string): string => {
  const normalized = value.toUpperCase();
  return `${normalized.slice(0, 1)}${normalized.slice(1).toLowerCase()}`;
};

export const toMinutes = (value: string): number => {
  const [rawHour = "0", rawMinute = "0"] = value.split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  return hour * 60 + minute;
};

export const toDisplayTime = (value: string): string => {
  const [rawHour = "0", rawMinute = "00"] = value.split(":");
  const hour = Number(rawHour);
  const minute = rawMinute.padStart(2, "0").slice(0, 2);
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(normalizedHour).padStart(2, "0")}:${minute} ${suffix}`;
};

export const computeTeachingLoad = (
  lectureHour: number,
  laboratoryHour: number,
): number => {
  return lectureHour + laboratoryHour * 0.75;
};

export const mergeBlockLabels = (labels: string[]): string => {
  if (labels.length === 0) return "Not assigned";
  return Array.from(new Set(labels)).join(", ");
};

const sortBySessionOrder = (
  left: FacultyScheduleSessionInfo | null,
  right: FacultyScheduleSessionInfo | null,
): number => {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;

  const dayDiff = (DAY_ORDER[left.day] ?? 999) - (DAY_ORDER[right.day] ?? 999);
  if (dayDiff !== 0) return dayDiff;

  return toMinutes(left.start_time) - toMinutes(right.start_time);
};

export const sortScheduleRows = (
  rows: FacultyScheduleRow[],
): FacultyScheduleRow[] => {
  return [...rows].sort((left, right) => {
    const sessionDiff = sortBySessionOrder(left.session, right.session);
    if (sessionDiff !== 0) return sessionDiff;

    const courseDiff = left.course_code.localeCompare(right.course_code);
    if (courseDiff !== 0) return courseDiff;

    return left.row_id.localeCompare(right.row_id);
  });
};
