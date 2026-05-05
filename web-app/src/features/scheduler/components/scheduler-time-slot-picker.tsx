"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { toDisplayTime, toMinutes } from "@/features/scheduler/lib/schedule/utils";
import type { SessionConflictWindow } from "@/features/scheduler/lib/schedule/session-actions";

type SchedulerTimeSlotPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expectedHours: number;
  conflicts: SessionConflictWindow[];
  onConfirm: (range: { startTime: string; endTime: string }) => void;
};

const START_MINUTE = 7 * 60;
const END_MINUTE = 22 * 60;
const SLOT_MINUTES = 30;

const toTimeValue = (minutes: number): string => {
  const hour = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const minute = (minutes % 60).toString().padStart(2, "0");
  return `${hour}:${minute}:00`;
};

const isOverlaps = (
  leftStart: string,
  leftEnd: string,
  rightStart: string,
  rightEnd: string,
): boolean => {
  return toMinutes(leftStart) < toMinutes(rightEnd) && toMinutes(rightStart) < toMinutes(leftEnd);
};

const SchedulerTimeSlotPicker = ({
  open,
  onOpenChange,
  expectedHours,
  conflicts,
  onConfirm,
}: SchedulerTimeSlotPickerProps) => {
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [selectionHint, setSelectionHint] = useState<string>("");

  const startSlots = useMemo(() => {
    const slots: string[] = [];
    for (let minute = START_MINUTE; minute <= END_MINUTE - SLOT_MINUTES; minute += SLOT_MINUTES) {
      slots.push(toTimeValue(minute));
    }
    return slots;
  }, []);

  const getConflictReason = (slotStart: string, slotEnd: string): string | null => {
    const matched = conflicts.find((conflict) =>
      isOverlaps(slotStart, slotEnd, conflict.start_time, conflict.end_time),
    );
    return matched?.reason ?? null;
  };

  const expectedSlotCount = Math.max(Math.ceil((expectedHours * 60) / SLOT_MINUTES), 1);

  const getSortedIndices = (slotValues: string[]): number[] => {
    return slotValues
      .map((slot) => startSlots.indexOf(slot))
      .filter((index) => index >= 0)
      .sort((left, right) => left - right);
  };

  const isConsecutive = (indices: number[]): boolean => {
    if (indices.length <= 1) return true;
    for (let index = 1; index < indices.length; index += 1) {
      if (indices[index] - indices[index - 1] !== 1) {
        return false;
      }
    }
    return true;
  };

  const toggleSlot = (slotStart: string) => {
    const slotIndex = startSlots.indexOf(slotStart);
    if (slotIndex < 0) return;

    const slotEnd = toTimeValue(toMinutes(slotStart) + SLOT_MINUTES);
    if (getConflictReason(slotStart, slotEnd)) return;

    setSelectionHint("");
    setSelectedSlots((previous) => {
      const exists = previous.includes(slotStart);

      if (exists) {
        const next = previous.filter((slot) => slot !== slotStart);
        const nextIndices = getSortedIndices(next);

        if (!isConsecutive(nextIndices)) {
          setSelectionHint("Remove from either end to keep consecutive selection.");
          return previous;
        }

        return next;
      }

      if (previous.length >= expectedSlotCount) {
        setSelectionHint("Selection cannot exceed expected number of slots.");
        return previous;
      }

      if (previous.length === 0) {
        return [slotStart];
      }

      const previousIndices = getSortedIndices(previous);
      const minIndex = previousIndices[0];
      const maxIndex = previousIndices[previousIndices.length - 1];
      const canAppend = slotIndex === minIndex - 1 || slotIndex === maxIndex + 1;

      if (!canAppend) {
        setSelectionHint("Only consecutive timeslots can be selected.");
        return previous;
      }

      return [...previous, slotStart];
    });
  };

  const selectedIndices = getSortedIndices(selectedSlots);
  const selectedStart =
    selectedIndices.length > 0 ? startSlots[selectedIndices[0]] : null;
  const selectedEnd =
    selectedIndices.length > 0
      ? toTimeValue(
          toMinutes(startSlots[selectedIndices[selectedIndices.length - 1]]) +
            SLOT_MINUTES,
        )
      : null;
  const selectedCount = selectedSlots.length;

  const selectedLabel =
    selectedStart && selectedEnd
      ? `${toDisplayTime(selectedStart)} - ${toDisplayTime(selectedEnd)}`
      : "No time selected";

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Select Time Slot"
      description="Select timeslots manually. Selection must stay consecutive and within expected duration."
      contentClassName="flex max-h-[85vh] p-4 flex-col overflow-hidden"
      variant="floating-medium"
    >
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <p className="text-xs text-foreground/70">
          Expected duration: {expectedHours.toFixed(2)} hour(s) ({expectedSlotCount} slot
          {expectedSlotCount > 1 ? "s" : ""})
        </p>

        <div className="grid max-h-[52vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
          {startSlots.map((slotStart) => {
            const slotEnd = toTimeValue(toMinutes(slotStart) + SLOT_MINUTES);
            const reason = getConflictReason(slotStart, slotEnd);
            const disabled = Boolean(reason);
            const isSelected = selectedSlots.includes(slotStart);

            return (
              <button
                key={slotStart}
                type="button"
                onClick={() => toggleSlot(slotStart)}
                disabled={disabled}
                className={[
                  "rounded-md border px-2 py-2 text-left text-xs transition",
                  disabled
                    ? "cursor-not-allowed border-foreground/10 bg-foreground/5 text-foreground/50"
                    : "hover:bg-foreground/5",
                  isSelected ? "border-foreground/60 bg-foreground/10" : "",
                ].join(" ")}
                title={reason ?? "Available"}
              >
                <div className="gap-2 min-h-8 flex flex-row items-center">
                  <div
                    className={[
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      disabled
                        ? "border-foreground/20"
                        : isSelected
                          ? "border-foreground bg-foreground text-background"
                          : "border-foreground/40",
                    ].join(" ")}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>

                  <div className="flex-1 ">
                    <p className="text-base">{toDisplayTime(slotStart)} - {toDisplayTime(slotEnd)}</p>
              
                    {reason && <p className="text-xs text-red-700">{reason}</p>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-md border bg-foreground/5 px-3 py-2 text-xs">
          <p className="font-medium">Selected Range</p>
          <p className="text-foreground/80">{selectedLabel}</p>
          {selectedCount > 0 ? (
            <p className="text-foreground/70">
              Selected: {(selectedCount * SLOT_MINUTES / 60).toFixed(2)} hour(s)
            </p>
          ) : null}
          {selectionHint && <p className="text-red-700">{selectionHint}</p>}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedSlots([]);
              setSelectionHint("");
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!selectedStart || !selectedEnd) return;
              onConfirm({ startTime: selectedStart, endTime: selectedEnd });
              onOpenChange(false);
            }}
            disabled={!selectedStart || !selectedEnd}
          >
            OK
          </Button>
        </div>
      </div>
    </AppDialog>
  );
};

export default SchedulerTimeSlotPicker;
