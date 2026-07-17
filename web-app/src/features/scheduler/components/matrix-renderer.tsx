import React from "react";
import { dayLabel } from "@/features/scheduler/lib/schedule/utils";
import type { SessionDay } from "@/features/shared/types/models";
import type { SchedulerMatrixSession } from "@/features/scheduler/lib/schedule/mapper";
import { cn } from "@/utils/style";

type MatrixRendererProps = {
  title: string;
  headerAction?: React.ReactNode;
  days: SessionDay[];
  timeSlots: string[];
  matrix: Record<SessionDay, Record<number, SchedulerMatrixSession[]>>;
  hoveredRow: number | null;
  onHoverRow: (rowIndex: number | null) => void;
  loading?: boolean;
  emptyHint?: string | null;
  startColumn: number;
  highlightedClassId?: string | null;
  selectedSessionId?: string | null;
  selectedRange?: { day: SessionDay; startIndex: number; endIndex: number } | null;
  onCellMouseDown?: (
    day: SessionDay,
    rowIndex: number,
    items: SchedulerMatrixSession[],
  ) => void;
  onCellMouseEnter?: (
    day: SessionDay,
    rowIndex: number,
    items: SchedulerMatrixSession[],
  ) => void;
  onCellClick?: (
    day: SessionDay,
    rowIndex: number,
    items: SchedulerMatrixSession[],
  ) => void;
};

const MatrixRenderer = ({
  title,
  headerAction,
  days,
  timeSlots,
  matrix,
  hoveredRow,
  onHoverRow,
  loading = false,
  emptyHint,
  startColumn,
  highlightedClassId,
  selectedSessionId,
  selectedRange,
  onCellMouseDown,
  onCellMouseEnter,
  onCellClick,
}: MatrixRendererProps) => {
  return (
    <>
      {/* ROW 1: SECTION HEADER (STICKY TOP) */}
      <div
        className="select-none sticky top-0 z-40 bg-foreground/80 flex flex-col border-b border-r-4 border-foreground/10 px-2 py-1.5 text-xs font-semibold"
        style={{
          gridColumn: `${startColumn} / span ${days.length}`,
          gridRow: 1,
        }}
      >
        <div className="flex items-center gap-2 text-sm text-background">
          <span>{title}</span>  
          {headerAction ? (
            <div className="flex items-center gap-1 flex-1 text-foreground">{headerAction}</div>
          ) : null}
        </div>
        
      </div>

      {/* ROW 2: DAY HEADERS (STICKY BELOW ROW 1) */}
      {days.map((day, dayIndex) => (
        <div
          key={`header-${title}-${day}`}
          className={cn("select-none sticky z-30 bg-background flex items-center justify-center border-b-4 border-r border-foreground/10 px-2 py-1 text-xs font-medium text-foreground/70", dayIndex === 6 && "border-r-4")}  
          style={{
            gridColumn: startColumn + dayIndex,
            gridRow: 2,
            top: "2.5rem", // height of row 1
          }}
        >
          {dayLabel(day)}
        </div>
      ))}

      {/* BODY */}
      {timeSlots.map((slot, rowIndex) =>
        days.map((day, dayIndex) => {
          const items = matrix[day]?.[rowIndex] ?? [];
          const isSelected =
            selectedRange &&
            selectedRange.day === day &&
            rowIndex >= Math.min(selectedRange.startIndex, selectedRange.endIndex) &&
            rowIndex <= Math.max(selectedRange.startIndex, selectedRange.endIndex);
          return (
            <div
              key={`${title}-${day}-${slot}`}
              data-matrix={title}
              data-day={day}
              data-row={rowIndex}
              className={cn(
                "select-none border-b border-r border-foreground/10 text-xs leading-tight",
                dayIndex === 6 && "border-r-4",
                hoveredRow === rowIndex && "bg-foreground/5 border-y-foreground/20",
                isSelected && "bg-green-100 cursor-grabbing",
              )}
              style={{
                gridColumn: startColumn + dayIndex,
                gridRow: 3 + rowIndex,
              }}
              onMouseEnter={() => {
                onHoverRow(rowIndex);
                onCellMouseEnter?.(day, rowIndex, items);
              }}
              onMouseDown={() => onCellMouseDown?.(day, rowIndex, items)}
              onClick={() => onCellClick?.(day, rowIndex, items)}
            >
              <div className="flex h-full flex-col gap-1">
                {items.map((item) => (
                  <span
                    key={item.id}
                    className={cn(
                      "h-full flex items-center justify-center font-medium text-foreground",
                      item.visual_source === "merged_conflict"
                        ? "bg-gray-300 text-amber-950"
                        : selectedSessionId && item.id === selectedSessionId
                        ? `${highlightedClassId && item.class_id === highlightedClassId ? "bg-blue-100" : "bg-yellow-100"} ring-1 ring-orange-400`
                        : highlightedClassId && item.class_id === highlightedClassId
                          ? "bg-blue-100"
                          : "bg-yellow-100 cursor-pointer",
                    )}
                    title={item.visual_label ?? item.class_code}
                  >
                    {item.class_code}
                  </span>
                ))}
                {items.length === 0 && !loading && emptyHint ? (
                  <span className="text-[10px] text-foreground/40">
                    {emptyHint}
                  </span>
                ) : null}
              </div>
            </div>
          );
        }),
      )}
    </>
  );
};

export default MatrixRenderer;
