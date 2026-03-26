"use client";

import { useEffect, useState } from "react";
import { Calendar, ChevronDown, Download, Printer } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AcademicTermPickerDialog } from "@/components/schedule/academic-term-picker-dialog";
import {
  FacultyScheduleCard,
  FacultyTeachingLoadCard,
} from "@/components/schedule/faculty/faculty-load-schedule-cards";
import { AddTile } from "@/components/ui/add-tile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ACADEMIC_TERM_QUERY_PARAM,
  FacultySchedulePageData,
} from "@/lib/schedule/types";
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
        <FacultyTeachingLoadCard
          className="flex-1"
          teachingLoadRows={data.teaching_load_rows}
          totalTeachingLoad={data.total_teaching_load}
        />
      </div>

      <div className="lg:col-span-3 h-full overflow-hidden flex flex-col gap-4">
        <FacultyScheduleCard
          className="flex-1"
          hasSchedule={data.has_schedule}
          scheduleRows={data.schedule_rows}
          headerActions={
            <>
              <Button title="Export to PDF">
                <Download className="text-background" />
              </Button>
              <Button title="Print Schedule">
                <Printer className="text-background" />
              </Button>
            </>
          }
        />
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
