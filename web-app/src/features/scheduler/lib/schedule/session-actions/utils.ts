import type { SessionDay, SessionType } from "@/features/shared/types/models";
import type { MutationError } from "./types";

export const first = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

export const mapMutationError = (error: MutationError): string => {
  return error.message ?? "Unexpected error while saving session";
};

export const toMinutes = (value: string): number => {
  const [rawHour = "0", rawMinute = "0"] = value.split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  return hour * 60 + minute;
};

export const overlaps = (
  leftStart: string,
  leftEnd: string,
  rightStart: string,
  rightEnd: string,
): boolean => {
  return (
    toMinutes(leftStart) < toMinutes(rightEnd) &&
    toMinutes(rightStart) < toMinutes(leftEnd)
  );
};

export const normalizeDay = (
  value: SessionDay | null | undefined,
): SessionDay => {
  return value ?? "Monday";
};

export const normalizeType = (
  value: SessionType | null | undefined,
): SessionType => {
  return value ?? "Lecture";
};
