import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FacultyScheduleRow, FacultyTeachingLoadRow } from "@/lib/schedule/types";
import { dayLabel, toDisplayTime } from "@/lib/schedule/utils";
import { cn } from "@/utils/style";
import { numberToHourDuration } from "@/utils/time";

type FacultyTeachingLoadCardProps = {
  teachingLoadRows: FacultyTeachingLoadRow[];
  totalTeachingLoad: number;
  title?: string;
  className?: string;
};

export const FacultyTeachingLoadCard = ({
  teachingLoadRows,
  totalTeachingLoad,
  title = "Teaching Load",
  className,
}: FacultyTeachingLoadCardProps) => {
  return (
    <Card className={cn("gap-2 overflow-hidden flex flex-col", className)}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <span className="inline-flex items-center rounded-full border bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
            Total Load: {totalTeachingLoad.toFixed(2)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 overflow-auto">
        {teachingLoadRows.length === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-4 text-sm text-foreground/70">
            No classes found for the selected academic term.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-foreground/70">
                  <th className="px-2 py-1.5 min-w-24">Course</th>
                  <th className="px-2 py-1.5 min-w-48">Title</th>
                  <th className="px-2 py-1.5 min-w-40">Block(s)</th>
                  <th className="px-2 py-1.5 min-w-28">Campus</th>
                  <th className="px-2 py-1.5 ">Load</th>
                </tr>
              </thead>
              <tbody>
                {teachingLoadRows.map((row) => (
                  <tr key={row.class_id} className="border-b">
                    <td className="px-2 py-1.5 font-medium">{row.course_code}</td>
                    <td className="px-2 py-1.5">{row.course_title}</td>
                    <td className="px-2 py-1.5 text-xs text-foreground/80">
                      {row.merged_block_label}
                    </td>
                    <td className="px-2 py-1.5 text-xs text-foreground/80">
                      {row.campus_label}
                    </td>
                    <td className="px-2 py-1.5  tabular-nums">
                      {row.load.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

type FacultyScheduleCardProps = {
  hasSchedule: boolean;
  scheduleRows: FacultyScheduleRow[];
  title?: string;
  className?: string;
  headerActions?: ReactNode;
};

export const FacultyScheduleCard = ({
  hasSchedule,
  scheduleRows,
  title = "Schedule",
  className,
  headerActions,
}: FacultyScheduleCardProps) => {
  return (
    <Card className={cn("gap-2 overflow-hidden flex flex-col", className)}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {headerActions ? <div className="flex gap-2">{headerActions}</div> : null}
      </CardHeader>
      <CardContent className="min-h-0 overflow-auto">
        {!hasSchedule ? (
          <p className="rounded-md border border-dashed px-3 py-4 text-sm text-foreground/70">
            No schedule has been created for this academic term.
          </p>
        ) : scheduleRows.length === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-4 text-sm text-foreground/70">
            Schedule exists, but there are no session entries yet.
          </p>
        ) : (
          <div className="space-y-2 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-foreground/70">
                  <th className="px-1.5 py-1.5 min-w-20">Time</th>
                  <th className="px-1.5 py-1.5 min-w-14">Day</th>
                  <th className="px-1.5 py-1.5 min-w-56">Course Code and Title</th>
                  <th className="px-1.5 py-1.5 min-w-16">Lec Hr(s)</th>
                  <th className="px-1.5 py-1.5 min-w-32">Lec. Rm</th>
                  <th className="px-1.5 py-1.5 min-w-16">Lab. Hr(s)</th>
                  <th className="px-1.5 py-1.5 min-w-32">Lab. Rm</th>
                  <th className="px-1.5 py-1.5 min-w-20">Block(s) (Code)</th>
                  <th className="px-1.5 py-1.5 min-w-14">No of Students</th>
                </tr>
              </thead>
              <tbody>
                {scheduleRows.map((row) => (
                  <tr key={row.row_id} className="border-b">
                    <td className="px-1.5 py-1.5">
                      {row.session
                        ? `${toDisplayTime(row.session.start_time)} - ${toDisplayTime(row.session.end_time)}`
                        : "-"}
                    </td>
                    <td className="px-1.5 py-1.5">
                      {row.session_days.length > 0
                        ? row.session_days.map((day) => dayLabel(day)).join(" / ")
                        : "-"}
                    </td>
                    <td className="px-1.5 py-1.5">
                      <span className="font-medium">{row.course_code}</span>
                      {` - ${row.course_title}`}
                    </td>
                    <td className="px-1.5 py-1.5  tabular-nums">
                      {row.lecture_hours !== null ? numberToHourDuration(row.lecture_hours) : "-"}
                    </td>
                    <td className="px-1.5 py-1.5 text-xs">
                      {row.lecture_room ?? "-"}
                    </td>
                    <td className="px-1.5 py-1.5  tabular-nums">
                      {row.laboratory_hours !== null
                        ? numberToHourDuration(row.laboratory_hours)
                        : "-"}
                    </td>
                    <td className="px-1.5 py-1.5 text-xs">
                      {row.laboratory_room ?? "-"}
                    </td>
                    <td className="px-1.5 py-1.5 text-xs text-foreground/80">
                      {row.block_codes_label}
                    </td>
                    <td className="px-1.5 py-1.5  tabular-nums">
                      {row.student_count ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
