"use client";

import { useEffect, useState } from "react";
import { Calendar, ChevronDown, Download, Printer } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AcademicTermPickerDialog } from "@/components/schedule/academic-term-picker-dialog";
import { AddTile } from "@/components/ui/add-tile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ACADEMIC_TERM_QUERY_PARAM,
  FacultySchedulePageData,
} from "@/lib/schedule/types";
import { dayLabel, toDisplayTime } from "@/lib/schedule/utils";
import { formatAcademicTermLabel } from "@/utils/string";

type FacultyScheduleViewProps = {
  data: FacultySchedulePageData;
};

export const FacultyScheduleView = ({ data }: FacultyScheduleViewProps) => {
  const [isTermPickerOpen, setIsTermPickerOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedTerm = data.selected_term;

  const setAcademicTermQuery = (termId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(ACADEMIC_TERM_QUERY_PARAM, termId);
    router.replace(`${pathname}?${params.toString()}`);
    router.refresh();
  };

  useEffect(() => {
    if (!data.selected_term_id) return;

    const currentTermQuery = searchParams.get(ACADEMIC_TERM_QUERY_PARAM);
    if (currentTermQuery) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set(ACADEMIC_TERM_QUERY_PARAM, data.selected_term_id);
    router.replace(`${pathname}?${params.toString()}`);
  }, [data.selected_term_id, pathname, router, searchParams]);

  return (
    <div className="h-full overflow-hidden grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="h-full overflow-hidden flex flex-col gap-4">
        <Card className="gap-2">
          <CardHeader className="gap-0">
            <CardTitle className="text-base">Select Academic Term</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 overflow-auto">
            {selectedTerm ? (
              <div className="rounded-md w-full border flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 p-4 text-sm">
                  <Calendar className="h-8 w-8 text-foreground/70" />
                  <div>
                    <p className="font-medium">
                      {formatAcademicTermLabel(selectedTerm)}
                    </p>

                    {selectedTerm.is_active ? (
                      <p className="text-emerald-700">Current active term</p>
                    ) : null}
                  </div>
                </div>

                <div className="pr-3 flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsTermPickerOpen(true)}
                    title="Change academic term"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}

            {!selectedTerm ? (
              <AddTile
                title="Select Academic Term"
                description="Open searchable term list"
                onClick={() => setIsTermPickerOpen(true)}
              />
            ) : null}
          </CardContent>
        </Card>
        <Card className="flex-1 gap-2 overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Teaching Load</CardTitle>
              <span className="inline-flex items-center rounded-full border bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                Total Load: {data.total_teaching_load.toFixed(2)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="min-h-0 overflow-auto">
            {data.teaching_load_rows.length === 0 ? (
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
                      <th className="px-2 py-1.5 text-right">Load</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.teaching_load_rows.map((row) => (
                      <tr key={row.class_id} className="border-b">
                        <td className="px-2 py-1.5 font-medium">
                          {row.course_code}
                        </td>
                        <td className="px-2 py-1.5">{row.course_title}</td>
                        <td className="px-2 py-1.5 text-xs text-foreground/80">
                          {row.merged_block_label}
                        </td>
                        <td className="px-2 py-1.5 text-xs text-foreground/80">
                          {row.campus_label}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums">
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
      </div>

      <div className="lg:col-span-3 h-full overflow-hidden flex flex-col gap-4">
        <Card className="flex-1 gap-2 overflow-hidden flex flex-col">
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Schedule</CardTitle>
            <div className="flex gap-2">
              <Button title="Export to PDF">
                <Download className="text-background" />
              </Button>
              <Button title="Print Schedule">
                <Printer className="text-background" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="min-h-0 overflow-auto">
            {!data.has_schedule ? (
              <p className="rounded-md border border-dashed px-3 py-4 text-sm text-foreground/70">
                No schedule has been created for this academic term.
              </p>
            ) : data.schedule_rows.length === 0 ? (
              <p className="rounded-md border border-dashed px-3 py-4 text-sm text-foreground/70">
                Schedule exists, but there are no session entries yet.
              </p>
            ) : (
              <div className="space-y-2 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-foreground/70">
                      <th className="px-1.5 py-1.5 min-w-24">Course</th>
                      <th className="px-1.5 py-1.5 min-w-36">Block(s)</th>
                      <th className="px-1.5 py-1.5 min-w-24">Day</th>
                      <th className="px-1.5 py-1.5 min-w-24">Start</th>
                      <th className="px-1.5 py-1.5 min-w-24">End</th>
                      <th className="px-1.5 py-1.5 min-w-40">Room</th>
                      <th className="px-1.5 py-1.5 min-w-24">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.schedule_rows.map((row) => (
                      <tr key={row.row_id} className="border-b">
                        <td className="px-1.5 py-1.5 font-medium">
                          {row.course_code}
                        </td>
                        <td className="px-1.5 py-1.5 text-xs text-foreground/80">
                          {row.merged_block_label}
                        </td>
                        {row.session ? (
                          <>
                            <td className="px-1.5 py-1.5">
                              {dayLabel(row.session.day)}
                            </td>
                            <td className="px-1.5 py-1.5">
                              {toDisplayTime(row.session.start_time)}
                            </td>
                            <td className="px-1.5 py-1.5">
                              {toDisplayTime(row.session.end_time)}
                            </td>
                            <td className="px-1.5 py-1.5 text-xs">
                              {row.session.room_code ?? "Unknown"}
                              {row.session.room_name
                                ? ` - ${row.session.room_name}`
                                : ""}
                            </td>
                            <td className="px-1.5 py-1.5">
                              {row.session.type}
                            </td>
                          </>
                        ) : (
                          <td
                            colSpan={5}
                            className="px-1.5 py-1.5 text-xs text-foreground/70"
                          >
                            No session schedule has been assigned yet.
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AcademicTermPickerDialog
        open={isTermPickerOpen}
        onOpenChange={setIsTermPickerOpen}
        terms={data.terms}
        selectedTermId={data.selected_term_id}
        onSelectTerm={(termId) => {
          setAcademicTermQuery(termId);
          setIsTermPickerOpen(false);
        }}
      />
    </div>
  );
};
