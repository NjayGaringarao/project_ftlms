"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TermSwitcher from "@/features/shared/components/pickers/term-switcher";
import {
  FacultyScheduleCard,
  FacultyTeachingLoadCard,
} from "@/features/profile/components/schedule/faculty/faculty-load-schedule-cards";
import { FacultyFtlExportTrigger } from "@/features/document-export/components/faculty-ftl-export-trigger";
import {
  ACADEMIC_TERM_QUERY_PARAM,
  FacultySchedulePageData,
} from "@/features/scheduler/lib/schedule/types";

type FacultyScheduleViewProps = {
  data: FacultySchedulePageData;
  userId: string;
};

export const FacultyScheduleView = ({
  data,
  userId,
}: FacultyScheduleViewProps) => {
  // The page keys this view by term so pending state resets when data arrives.
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
        total_teaching_load: 0,
        schedule_rows: [],
        has_schedule: false,
      }
    : data;

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
        <div className="space-y-2">
          <TermSwitcher
            terms={data.terms}
            selectedTermId={data.selected_term_id ?? undefined}
            routeConfig={{ mode: "query", paramName: ACADEMIC_TERM_QUERY_PARAM }}
            buttonClassName="w-full min-w-0 justify-between bg-background"
            buttonSize="default"
            onTermSelect={(termId) =>
              setIsNavigating(termId !== data.selected_term_id)
            }
          />
          {selectedTerm?.is_active ? (
            <p className="text-sm text-emerald-700">Current active term</p>
          ) : null}
        </div>

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
    </div>
  );
};
