"use client";

import { useEffect, useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AcademicTermPickerDialog } from "@/features/profile/components/schedule/academic-term-picker-dialog";
import {
  FacultyScheduleCard,
  FacultyTeachingLoadCard,
} from "@/features/profile/components/schedule/faculty/faculty-load-schedule-cards";
import { FacultyFtlExportTrigger } from "@/features/document-export/components/faculty-ftl-export-trigger";
import { AddTile } from "@/components/ui/add-tile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ACADEMIC_TERM_QUERY_PARAM,
  FacultySchedulePageData,
} from "@/features/scheduler/lib/schedule/types";
import { formatAcademicTermLabel } from "@/utils/string";

type FacultyScheduleViewProps = {
  data: FacultySchedulePageData;
  userId: string;
};

export const FacultyScheduleView = ({
  data,
  userId,
}: FacultyScheduleViewProps) => {
  const [isTermPickerOpen, setIsTermPickerOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedTerm = data.selected_term;

  // While navigating, show empty tables so stale data doesn't linger on screen.
  const displayData = isNavigating
    ? {
        ...data,
        teaching_load_rows: [],
        schedule_rows: [],
        has_schedule: false,
      }
    : data;

  const setAcademicTermQuery = (termId: string) => {
    setIsNavigating(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set(ACADEMIC_TERM_QUERY_PARAM, termId);
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Reset navigation flag once server data reflects the new term
  useEffect(() => {
    setIsNavigating(false);
  }, [data.selected_term_id]);

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

        <FacultyTeachingLoadCard
          className="flex-1"
          teachingLoadRows={displayData.teaching_load_rows}
          totalTeachingLoad={displayData.total_teaching_load}
          headerAction={
            <FacultyFtlExportTrigger
              userId={userId}
              academicTermId={data.selected_term_id}
              isAvailable={data.ftl_available}
              isLoading={isNavigating}
            />
          }
        />
      </div>

      <div className="lg:col-span-3 h-full overflow-hidden flex flex-col gap-4">
        <FacultyScheduleCard
          className="flex-1"
          hasSchedule={displayData.has_schedule}
          scheduleRows={displayData.schedule_rows}
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
