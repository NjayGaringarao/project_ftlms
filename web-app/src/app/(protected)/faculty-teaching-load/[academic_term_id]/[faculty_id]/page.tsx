import ConcurrentLoadSummary from "@/features/faculty-teaching-load/components/concurrent-load-summary";
import FacultyLoadStatusPanel from "@/features/faculty-teaching-load/components/faculty-load-status-panel";
import { FacultyScheduleCard } from "@/features/profile/components/schedule/faculty/faculty-load-schedule-cards";
import { getTermById } from "@/features/admin/lib/terms";
import { buildFacultyLoadSnapshot } from "@/features/ftl-evaluation/lib/load-proposal/snapshot";
import { getFacultyScheduleTermSnapshot } from "@/features/scheduler/lib/schedule/faculty-schedule";
import { getUserDataById } from "@/features/profile/lib/user-data/queries";
import { redirect } from "next/navigation";

type FacultyIdPageProps = {
  params: Promise<{ academic_term_id: string; faculty_id: string }>;
};

const FacultyIdPage = async ({ params }: FacultyIdPageProps) => {
  const { academic_term_id, faculty_id } = await params;

  const [currentData, selectedTerm, scheduleSnapshot] = await Promise.all([
    getUserDataById(faculty_id, {
      academicTermId: academic_term_id,
      includeDegrees: true,
      includeDesignations: true,
      includeClasses: true,
      includeLoads: true,
    }),
    getTermById(academic_term_id),
    getFacultyScheduleTermSnapshot(faculty_id, academic_term_id),
  ]);

  if (!currentData) redirect(`/faculty-teaching-load/${academic_term_id}`);

  const academicTermCode = selectedTerm?.code ?? "Unknown term";
  const snapshot = await buildFacultyLoadSnapshot({
    userData: currentData,
    userId: faculty_id,
    academicTermId: academic_term_id,
  });
  const manageScheduleLinksByClassId = scheduleSnapshot.schedule_rows.reduce<
    Record<string, string>
  >((acc, row) => {
    if (acc[row.class_id]) return acc;
    if (!row.primary_block_id || !row.primary_course_utilization_id) return acc;

    const query = new URLSearchParams();
    query.set("academic_term_id", academic_term_id);
    query.set("blockId", row.primary_block_id);
    query.set("courseUtilizationId", row.primary_course_utilization_id);
    query.set("facultyId", faculty_id);

    acc[row.class_id] = `/scheduler?${query.toString()}`;
    return acc;
  }, {});

  return (
    <div className="flex flex-row gap-4 h-full">
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <FacultyScheduleCard
          className="h-full"
          hasSchedule={scheduleSnapshot.has_schedule}
          scheduleRows={scheduleSnapshot.schedule_rows}
          manageScheduleLinksByClassId={manageScheduleLinksByClassId}
        />
          <FacultyLoadStatusPanel
            academicTermId={academic_term_id}
            facultyId={faculty_id}
            facultyCampusCode={currentData.campus?.code ?? null}
          />

      </div>
        <div className="flex flex-col w-94 overflow-hidden">
          <ConcurrentLoadSummary
            userData={currentData}
            academicTermCode={academicTermCode}
            snapshot={snapshot}
          />
        </div>

    </div>
  );
};

export default FacultyIdPage;
