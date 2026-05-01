import { FacultyScheduleCard } from "@/features/profile/components/schedule/faculty/faculty-load-schedule-cards";
import type { FacultyScheduleTermSnapshot } from "@/features/scheduler/lib/schedule/types";

type FacultyEvaluationScheduleProps = {
  scheduleSnapshot: FacultyScheduleTermSnapshot;
};

const FacultyEvaluationSchedule = ({
  scheduleSnapshot,
}: FacultyEvaluationScheduleProps) => {
  return (
    <FacultyScheduleCard
      className="h-full"
      hasSchedule={scheduleSnapshot.has_schedule}
      scheduleRows={scheduleSnapshot.schedule_rows}
    />
  );
};

export default FacultyEvaluationSchedule;
