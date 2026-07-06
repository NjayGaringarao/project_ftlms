import { calculateAtl } from "@/features/course-loading/lib/calculations";
import { LabelValue } from "./types";

export type FacultyClassRow = {
  facultyId: string;
  facultyName: string;
  lectureUnit: number;
  laboratoryUnit: number;
};

export const sumFacultyLoads = (rows: FacultyClassRow[]): LabelValue[] => {
  const totals = new Map<string, LabelValue>();
  rows.forEach((row) => {
    const existing = totals.get(row.facultyId);
    const load = calculateAtl(row.lectureUnit, row.laboratoryUnit);
    if (existing) {
      existing.value += load;
    } else {
      totals.set(row.facultyId, { label: row.facultyName, value: load });
    }
  });
  return Array.from(totals.values())
    .map((item) => ({ ...item, value: Number(item.value.toFixed(2)) }))
    .sort((left, right) => right.value - left.value);
};

export const countBy = <T>(
  rows: T[],
  getLabel: (row: T) => string,
): LabelValue[] => {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const label = getLabel(row);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return Array.from(counts.entries()).map(([label, value]) => ({
    label,
    value,
  }));
};

export const sumBy = <T>(
  rows: T[],
  getLabel: (row: T) => string,
  getValue: (row: T) => number,
): LabelValue[] => {
  const sums = new Map<string, number>();
  rows.forEach((row) => {
    const label = getLabel(row);
    sums.set(label, (sums.get(label) ?? 0) + getValue(row));
  });
  return Array.from(sums.entries()).map(([label, value]) => ({
    label,
    value,
  }));
};

export const sortByValueDesc = (items: LabelValue[]): LabelValue[] =>
  [...items].sort((left, right) => right.value - left.value);

// "HH:MM:SS" − "HH:MM:SS" in fractional hours; sessions guarantee end > start.
export const sessionHours = (startTime: string, endTime: string): number => {
  const toMinutes = (value: string): number => {
    const [hours = 0, minutes = 0] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };
  const delta = toMinutes(endTime) - toMinutes(startTime);
  return delta > 0 ? delta / 60 : 0;
};
