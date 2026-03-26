import { FacultyScheduleCard } from "@/components/schedule/faculty/faculty-load-schedule-cards";
import type { FacultyScheduleTermSnapshot } from "@/lib/schedule/types";

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
