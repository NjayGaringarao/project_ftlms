export type FacultyScheduleWindow = {
  id?: string;
  day: string;
  startMinute: number;
  endMinute: number;
};

export type FacultyScheduleWarning =
  | { code: "no-lunch-break" }
  | {
      code: "continuous-teaching";
      startMinute: number;
      endMinute: number;
    };

const LUNCH_START_MINUTE = 10 * 60;
const LUNCH_END_MINUTE = 14 * 60;
const LUNCH_DURATION_MINUTES = 60;
const CONTINUOUS_TEACHING_MINUTES = 6 * 60;

const isValidWindow = (window: FacultyScheduleWindow) =>
  Number.isFinite(window.startMinute) &&
  Number.isFinite(window.endMinute) &&
  window.endMinute > window.startMinute;

export const getFacultyScheduleWarnings = (
  sessions: FacultyScheduleWindow[],
  candidate: FacultyScheduleWindow,
  excludeSessionId?: string | null,
): FacultyScheduleWarning[] => {
  if (!isValidWindow(candidate)) return [];

  const windows = [
    ...sessions.filter(
      (session) =>
        session.day === candidate.day &&
        (!excludeSessionId || session.id !== excludeSessionId) &&
        isValidWindow(session),
    ),
    candidate,
  ].sort(
    (left, right) =>
      left.startMinute - right.startMinute ||
      left.endMinute - right.endMinute,
  );

  const merged: Array<{ startMinute: number; endMinute: number }> = [];
  for (const window of windows) {
    const previous = merged[merged.length - 1];
    if (previous && window.startMinute <= previous.endMinute) {
      previous.endMinute = Math.max(previous.endMinute, window.endMinute);
    } else {
      merged.push({
        startMinute: window.startMinute,
        endMinute: window.endMinute,
      });
    }
  }

  let freeStartMinute = LUNCH_START_MINUTE;
  let hasLunchBreak = false;
  for (const window of merged) {
    const busyStartMinute = Math.max(window.startMinute, LUNCH_START_MINUTE);
    const busyEndMinute = Math.min(window.endMinute, LUNCH_END_MINUTE);
    if (busyEndMinute <= busyStartMinute) continue;

    if (busyStartMinute - freeStartMinute >= LUNCH_DURATION_MINUTES) {
      hasLunchBreak = true;
      break;
    }
    freeStartMinute = Math.max(freeStartMinute, busyEndMinute);
  }
  hasLunchBreak ||=
    LUNCH_END_MINUTE - freeStartMinute >= LUNCH_DURATION_MINUTES;

  const warnings: FacultyScheduleWarning[] = [];
  if (!hasLunchBreak) warnings.push({ code: "no-lunch-break" });

  const candidateRun = merged.find(
    (window) =>
      window.startMinute <= candidate.startMinute &&
      window.endMinute >= candidate.endMinute,
  );
  if (
    candidateRun &&
    candidateRun.endMinute - candidateRun.startMinute >=
      CONTINUOUS_TEACHING_MINUTES
  ) {
    warnings.push({ code: "continuous-teaching", ...candidateRun });
  }

  return warnings;
};
