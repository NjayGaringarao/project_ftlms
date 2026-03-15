"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toDisplayTime } from "@/lib/schedule/utils";
import type { SessionConflictWindow } from "@/lib/schedule/session-actions";
import SchedulerTimeSlotPicker from "./scheduler-time-slot-picker";

type TimePickerProps     = {
  expectedHours: number;
  conflicts: SessionConflictWindow[];
  startTime: string | null;
  endTime: string | null;
  onRangeChange: (range: { startTime: string; endTime: string }) => void;
};

const TimePicker = ({
  expectedHours,
  conflicts,
  startTime,
  endTime,
  onRangeChange,
}: TimePickerProps) => {
  const [open, setOpen] = useState(false);

  const selectedTimeLabel = useMemo(() => {
    if (!startTime || !endTime) return "Pick a time range";
    return `${toDisplayTime(startTime)} - ${toDisplayTime(endTime)}`;
  }, [startTime, endTime]);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="justify-start"
        disabled={expectedHours <= 0}
      >
        <span className="truncate text-xs">{selectedTimeLabel}</span>
      </Button>

      <SchedulerTimeSlotPicker
        open={open}
        onOpenChange={setOpen}
        expectedHours={expectedHours}
        conflicts={conflicts}
        onConfirm={onRangeChange}
      />
    </>
  );
};

export default TimePicker;
