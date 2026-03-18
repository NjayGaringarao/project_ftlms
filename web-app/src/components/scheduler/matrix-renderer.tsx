import React from "react";
import { dayLabel } from "@/lib/schedule/utils";
import type { SessionDay } from "@/models";
import type { SchedulerMatrixSession } from "@/lib/schedule/mapper";
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
}: MatrixRendererProps) => {
  return (
    <>
      {/* ROW 1: SECTION HEADER (STICKY TOP) */}
      <div
        className="sticky top-0 z-40 bg-foreground/80 flex flex-col border-b border-r-4 border-foreground/10 px-2 py-1.5 text-xs font-semibold"
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
          className={cn("sticky z-30 bg-background flex items-center justify-center border-b-4 border-r border-foreground/10 px-2 py-1 text-xs font-medium text-foreground/70", dayIndex === 6 && "border-r-4")}  
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
          return (
            <div
              key={`${title}-${day}-${slot}`}
              className={cn(
                "border-b border-r border-foreground/10 text-xs leading-tight",
                dayIndex === 6 && "border-r-4",
                hoveredRow === rowIndex && "bg-foreground/5 border-y-foreground/20",
              )}
              style={{
                gridColumn: startColumn + dayIndex,
                gridRow: 3 + rowIndex,
              }}
              onMouseEnter={() => onHoverRow(rowIndex)}
            >
              <div className="flex h-full flex-col gap-1">
                {items.map((item) => (
                  <span
                    key={item.id}
                    className="bg-yellow-200 px-1 h-full flex items-center justify-center font-medium text-foreground"
                    title={item.class_code}
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
