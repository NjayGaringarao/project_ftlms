"use client";

import { Clock } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { numberToHourDuration } from "@/utils/time";
import { toDisplayTime } from "@/lib/schedule/utils";
import type { SessionType } from "@/models";
import type { CourseLoadingBlockListItem, FacultyListItem } from "@/lib/course-loading/types";
import type { ExtendedRoom } from "@/models";
import type { SchedulerCourseOfferingItem } from "@/lib/schedule/course-offerings";

type ConfirmScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingRange: {
    day: string;
    startIndex: number;
    endIndex: number;
  } | null;
  timeSlots: Array<{ start: string; end: string }>;
  sessionType: SessionType;
  selectedBlock: CourseLoadingBlockListItem | null;
  selectedOffering: SchedulerCourseOfferingItem | null;
  selectedFaculty: FacultyListItem | null;
  selectedRoom: ExtendedRoom | null;
  errorMessage?: string | null;
  isSaving: boolean;
  onConfirm: () => void;
};

const ConfirmScheduleDialog = ({
  open,
  onOpenChange,
  pendingRange,
  timeSlots,
  sessionType,
  selectedBlock,
  selectedOffering,
  selectedFaculty,
  selectedRoom,
  errorMessage,
  isSaving,
  onConfirm,
}: ConfirmScheduleDialogProps) => {
  const startSlot = pendingRange
    ? timeSlots[Math.min(pendingRange.startIndex, pendingRange.endIndex)]
    : null;
  const endSlot = pendingRange
    ? timeSlots[Math.max(pendingRange.startIndex, pendingRange.endIndex)]
    : null;

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Confirm Schedule"
      description="Review the details before creating this session."
      contentClassName="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden"
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
                  ((Math.abs(pendingRange.endIndex - pendingRange.startIndex) + 1) *
                    30) /
                    60,
                )}{" "}
                {sessionType})
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 mt-2 text-sm">
            <p>Block: {selectedBlock?.code ?? "None"}</p>
            <p>Course: {selectedOffering?.course_code ?? "None"}</p>
            <p>Faculty: {selectedFaculty?.name ?? "None"}</p>
            <p>Room: {selectedRoom?.code ?? "Online / None"}</p>
          </div>
        </div>

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
          <Button size="sm" onClick={onConfirm} disabled={isSaving}>
            {isSaving ? "Saving..." : "Confirm"}
          </Button>
        </div>
      </div>
    </AppDialog>
  );
};

export default ConfirmScheduleDialog;
