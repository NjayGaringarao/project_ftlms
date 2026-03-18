import React from "react";
import { dayLabel } from "@/lib/schedule/utils";
import type { SessionDay } from "@/models";
import type { SchedulerMatrixSession } from "@/lib/schedule/mapper";

type MatrixRendererProps = {
  title: string;
  subtitle?: string | null;
  headerAction?: React.ReactNode;
  days: SessionDay[];
  timeSlots: string[];
  matrix: Record<SessionDay, Record<number, SchedulerMatrixSession[]>>;
  loading?: boolean;
  emptyHint?: string | null;
  startColumn: number;
};

const MatrixRenderer = ({
  title,
  subtitle,
  headerAction,
  days,
  timeSlots,
  matrix,
  loading = false,
  emptyHint,
  startColumn,
}: MatrixRendererProps) => {
  return (
    <>
      <div
        className="flex flex-col border-b border-r border-foreground/10 px-2 py-1.5 text-xs font-semibold"
        style={{ gridColumn: `${startColumn} / span ${days.length}`, gridRow: 1 }}
      >
        <div className="flex items-center justify-between gap-2">
          <span>{title}</span>
          {headerAction ? (
            <div className="flex items-center gap-1">{headerAction}</div>
          ) : null}
        </div>
        {subtitle ? (
          <span className="text-[10px] font-normal text-foreground/70">
            {subtitle}
          </span>
        ) : null}
      </div>

      {days.map((day, dayIndex) => (
        <div
          key={`header-${title}-${day}`}
          className="border-b border-r border-foreground/10 px-2 py-1 text-[11px] font-medium text-foreground/70"
          style={{ gridColumn: startColumn + dayIndex, gridRow: 2 }}
        >
          {dayLabel(day)}
        </div>
      ))}

      {timeSlots.map((slot, rowIndex) =>
        days.map((day, dayIndex) => {
          const items = matrix[day]?.[rowIndex] ?? [];
          return (
            <div
              key={`${title}-${day}-${slot}`}
              className="border-b border-r border-foreground/10 px-1 py-1 text-[10px] leading-tight"
              style={{ gridColumn: startColumn + dayIndex, gridRow: 3 + rowIndex }}
            >
              <div className="flex h-full flex-col gap-1">
                {items.map((item) => (
                  <span
                    key={item.id}
                    className="rounded-sm bg-foreground/10 px-1 py-0.5 text-[10px] font-medium text-foreground"
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
