"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { numberToHourDuration } from "@/utils/time";
import { toDisplayTime, toMinutes } from "@/features/scheduler/lib/schedule/utils";
import {
  getSchedulerMapperMatrices,
  type SchedulerMatricesResult,
} from "@/features/scheduler/lib/schedule/mapper";
import { getFacultyScheduleWarnings } from "@/features/scheduler/lib/schedule/faculty-schedule-warnings";
import type { SessionType } from "@/features/shared/types/models";
import type { CourseLoadingSectionListItem } from "@/features/course-loading/lib/types";
import type { ExtendedRoom } from "@/features/shared/types/models";
import type { SchedulerCourseOfferingItem } from "@/features/scheduler/lib/schedule/course-offerings";

type ConfirmScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicTermId: string;
  facultyId: string | null;
  facultyName: string | null;
  excludeSessionId?: string | null;
  pendingRange: {
    day: string;
    startIndex: number;
    endIndex: number;
    mode?: "create" | "move";
  } | null;
  timeSlots: Array<{ start: string; end: string }>;
  sessionType: SessionType;
  selectedSection: CourseLoadingSectionListItem | null;
  selectedOffering: SchedulerCourseOfferingItem | null;
  selectedRoom: ExtendedRoom | null;
  errorMessage?: string | null;
  isSaving: boolean;
  onConfirm: () => void;
};

const displayMinute = (minute: number) =>
  toDisplayTime(
    `${Math.floor(minute / 60)}:${String(minute % 60).padStart(2, "0")}`,
  );

const ConfirmScheduleDialog = ({
  open,
  onOpenChange,
  academicTermId,
  facultyId,
  facultyName,
  excludeSessionId,
  pendingRange,
  timeSlots,
  sessionType,
  selectedSection,
  selectedOffering,
  selectedRoom,
  errorMessage,
  isSaving,
  onConfirm,
}: ConfirmScheduleDialogProps) => {
  const [scheduleCheck, setScheduleCheck] =
    useState<SchedulerMatricesResult | null>(null);

  useEffect(() => {
    if (!facultyId) return;
    let cancelled = false;

    const checkSchedule = async () => {
      try {
        // Read the full instructor schedule, including other sections, fresh
        // for each confirmation rather than relying on a loading grid.
        const result = await getSchedulerMapperMatrices(academicTermId, {
          facultyId,
        });
        if (!cancelled) setScheduleCheck(result);
      } catch {
        if (!cancelled) {
          setScheduleCheck({
            section: [],
            faculty: [],
            room: [],
            error: "Unable to load schedules. Please try again.",
          });
        }
      }
    };

    void checkSchedule();
    return () => {
      cancelled = true;
    };
  }, [academicTermId, facultyId]);

  const startSlot = pendingRange
    ? timeSlots[Math.min(pendingRange.startIndex, pendingRange.endIndex)]
    : null;
  const endSlot = pendingRange
    ? timeSlots[Math.max(pendingRange.startIndex, pendingRange.endIndex)]
    : null;
  const isCheckingSchedule = Boolean(facultyId && !scheduleCheck);
  const warnings =
    scheduleCheck && !scheduleCheck.error && pendingRange && startSlot && endSlot
      ? getFacultyScheduleWarnings(
          scheduleCheck.faculty.map((session) => ({
            id: session.id,
            day: session.day,
            startMinute: toMinutes(session.start_time),
            endMinute: toMinutes(session.end_time),
          })),
          {
            day: pendingRange.day,
            startMinute: toMinutes(startSlot.start),
            endMinute: toMinutes(endSlot.end),
          },
          excludeSessionId,
        )
      : [];

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        pendingRange?.mode === "move" ? "Confirm Move" : "Confirm Schedule"
      }
      description={
        pendingRange?.mode === "move"
          ? "Review the new timeslot before moving this session."
          : "Review the details before creating this session."
      }
      contentClassName="flex max-h-[85vh] p-4 flex-col overflow-y-auto"
      variant="floating-medium"
    >
      <div className="flex flex-col gap-3">
        <div className="rounded-md border bg-foreground/5 p-3 text-sm">
          {pendingRange && startSlot && endSlot ? (
            <div className="flex flex-row gap-2 items-center">
              <Clock className="inline-block h-6 w-6 *:text-foreground/70" />
              <p className="text-xl">
                {pendingRange.day} {toDisplayTime(startSlot.start)} -{" "}
                {toDisplayTime(endSlot.end)} (
                {numberToHourDuration(
                  ((Math.abs(pendingRange.endIndex - pendingRange.startIndex) +
                    1) *
                    30) /
                    60,
                )}{" "}
                {sessionType})
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 mt-2 text-sm">
            <p>Section: {selectedSection?.code ?? "None"}</p>
            <p>Course: {selectedOffering?.course_code ?? "None"}</p>
            <p>Faculty: {facultyName ?? "None"}</p>
            <p>Room: {selectedRoom?.code ?? "Online / None"}</p>
          </div>
        </div>

        {isCheckingSchedule ? (
          <p role="status" className="text-sm text-foreground/70">
            Checking lunch break and continuous teaching...
          </p>
        ) : null}

        {warnings.length > 0 || scheduleCheck?.error ? (
          <div
            role="alert"
            className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
          >
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">Instructor schedule warning</p>
              <p>
                {facultyName ?? "Instructor"} on {pendingRange?.day}
              </p>
              {scheduleCheck?.error ? (
                <p>
                  Lunch break and continuous teaching could not be checked.
                  Please review the instructor&apos;s schedule before confirming.
                </p>
              ) : (
                <ul className="list-disc space-y-1 pl-4">
                  {warnings.map((warning) => (
                    <li key={warning.code}>
                      {warning.code === "no-lunch-break" ? (
                        "No continuous 1-hour lunch break is available between 10:00 AM and 2:00 PM."
                      ) : (
                        <>
                          {numberToHourDuration(
                            (warning.endMinute - warning.startMinute) / 60,
                          )}{" "}
                          of continuous teaching ({displayMinute(warning.startMinute)}
                          {" - "}
                          {displayMinute(warning.endMinute)}).
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <p>
                Consider adjusting the schedule to allow a break. You can still confirm.
              </p>
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <p className="text-xs text-red-700">{errorMessage}</p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            data-testid="confirm-schedule-button"
            onClick={onConfirm}
            disabled={isSaving || isCheckingSchedule}
          >
            {isSaving
              ? "Saving..."
              : isCheckingSchedule
                ? "Checking..."
                : pendingRange?.mode === "move"
                  ? "Move"
                  : "Confirm"}
          </Button>
        </div>
      </div>
    </AppDialog>
  );
};

export default ConfirmScheduleDialog;
