"use client";

import { useRouter } from "next/navigation";
import { ArrowUp, ClipboardClock, MoreHorizontal } from "lucide-react";
import type { FacultyClassRow } from "@/features/faculty-teaching-load/lib/course-loading/types";
import { formatFacultySectionLabel } from "@/features/faculty-teaching-load/lib/course-loading/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover } from "radix-ui";

type FacultyClassTableProps = {
  rows: FacultyClassRow[];
  academicTermId: string;
  facultyId: string;
};

const toFixed = (v: number) => v.toFixed(2);

export const FacultyClassTable = ({
  rows,
  academicTermId,
  facultyId,
}: FacultyClassTableProps) => {
  const router = useRouter();

  const handleManageSchedule = (row: FacultyClassRow) => {
    const firstSection = row.sections[0];
    if (!firstSection) return;

    const params = new URLSearchParams();
    params.set("academic_term_id", academicTermId);
    params.set("sectionId", firstSection.section_id);
    params.set("courseUtilizationId", firstSection.course_utilization_id);
    params.set("facultyId", facultyId);
    router.push(`/scheduler?${params.toString()}`);
  };

  const totalAtl = rows.reduce((sum, r) => sum + r.atl, 0);

  return (
    <Card className="flex-1 flex flex-col overflow-hidden">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-lg">Actual Teaching Load</CardTitle>
        <div className="flex items-center gap-1">
          <p className="px-3 py-2 text-right">
            Total: <b>{toFixed(totalAtl)}</b>{" "}
          </p>
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <table className="w-full text-sm rounded-md overflow-hidden">
           <thead className="sticky top-0 border-b bg-foreground/10">
            <tr className="text-left text-xs">
              <th className="px-3 py-2">Campus</th>
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Section(s)</th>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Laboratory</th>
              <th className="px-3 py-2">Lecture</th>
              <th className="px-3 py-2">ATL</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="py-4 text-left border-b"
              >
                <td className="px-3 py-2">{row.campus_name}</td>
                <td className="px-3 py-2">
                  <span className="font-medium">{row.course_code}</span>
                </td>
                <td className="px-3 py-2 text-foreground/70">
                  <div className="flex flex-col gap-1">
                    {row.sections.map((section) => (
                      <span
                        key={section.course_utilization_id}
                        className="rounded bg-foreground/10 px-1.5 py-0.5 text-xs"
                      >
                        {formatFacultySectionLabel(section)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <span>{row.student_count}</span>
                    {row.student_count > 50 ? (
                      <span
                        className="inline-flex items-center text-red-600"
                        title="Class size is above 50"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-2">
                  {toFixed(row.laboratory_unit * 3 * 0.75)}
                </td>
                <td className="px-3 py-2">{toFixed(row.lecture_unit)}</td>
                <td className="px-3 py-2 font-medium">{toFixed(row.atl)}</td>

                <td className="w-7">
                  <Popover.Root>
                    <Popover.Trigger>
                      <MoreHorizontal className="h-4 w-4" />
                    </Popover.Trigger>
                    <Popover.Anchor />
                    <Popover.Portal>
                      <Popover.Content>
                        <div className="flex flex-col bg-background rounded-md overflow-hidden shadow-md border">
                          <button
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-foreground/10 disabled:cursor-not-allowed disabled:hover:bg-transparent border-b"
                            disabled={row.sections.length === 0}
                            onClick={() => handleManageSchedule(row)}
                            title={
                              row.sections.length === 0
                                ? "No section assigned."
                                : "Manage Schedule"
                            }
                          >
                            <ClipboardClock className="h-4 w-4" /> Manage
                            Schedule
                          </button>
                        </div>
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-foreground/60"
                >
                  No classes assigned yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};
