"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ClipboardClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FacultyClassRow } from "@/lib/course-loading/types";
import { formatFacultyBlockLabel } from "@/lib/course-loading/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

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
    const firstBlock = row.blocks[0];
    if (!firstBlock) return;

    const params = new URLSearchParams();
    params.set("blockId", firstBlock.block_id);
    params.set("courseUtilizationId", firstBlock.course_utilization_id);
    params.set("facultyId", facultyId);
    router.push(`/scheduler/${academicTermId}/mapper?${params.toString()}`);
  };

  const totalAtl = rows.reduce((sum, r) => sum + r.atl, 0);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-lg">Teaching Designation</CardTitle>
        <div className="flex items-center gap-1">
          <p className="px-3 py-2 text-right">
            Actual Teaching Load: <b>{toFixed(totalAtl)}</b>{" "}
          </p>
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background border-b">
            <tr className="text-left text-xs text-foreground/60">
              <th className="px-3 py-2">Campus</th>
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Block(s)</th>
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
                className="py-4 text-left border-b hover:bg-foreground/5"
              >
                <td className="px-3 py-2">{row.campus_name}</td>
                <td className="px-3 py-2">
                  <span className="font-medium">{row.course_code}</span>
                </td>
                <td className="px-3 py-2 text-foreground/70">
                  <div className="flex flex-col gap-1">
                    {row.blocks.map((block) => (
                      <span
                        key={block.course_utilization_id}
                        className="rounded bg-foreground/10 px-1.5 py-0.5 text-xs"
                      >
                        {formatFacultyBlockLabel(block)}
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
                  {toFixed(row.laboratory_unit * 0.75)}
                </td>
                <td className="px-3 py-2">{toFixed(row.lecture_unit)}</td>
                <td className="px-3 py-2 font-medium">{toFixed(row.atl)}</td>

                <td className="w-28">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      title={
                        row.blocks.length === 0
                          ? "No block assigned."
                          : "Manage Schedule"
                      }
                      variant="outline"
                      size="sm"
                      disabled={row.blocks.length === 0}
                      onClick={() => handleManageSchedule(row)}
                    >
                      <ClipboardClock className="h-4 w-4" />
                    </Button>
                  </div>
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
