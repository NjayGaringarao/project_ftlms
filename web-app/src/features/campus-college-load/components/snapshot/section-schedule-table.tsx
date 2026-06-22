import type {
  CampusCollegeLoadSnapshotClass,
  CampusCollegeLoadSnapshotSession,
} from "@/features/shared/types/models";
import { formatTimeOfDay } from "@/utils/time";

type SectionScheduleRow = {
  classRow: CampusCollegeLoadSnapshotClass;
  session: CampusCollegeLoadSnapshotSession | null;
  key: string;
};

export const SectionScheduleTable = ({
  classes,
}: {
  classes: CampusCollegeLoadSnapshotClass[];
}) => {
  const rows: SectionScheduleRow[] = classes.flatMap((classRow): SectionScheduleRow[] => {
    if (classRow.sessions.length === 0) {
      return [{ classRow, session: null, key: classRow.class_id }];
    }
    return classRow.sessions.map((session, sessionIndex) => ({
      classRow,
      session,
      key: `${classRow.class_id}-${sessionIndex}`,
    }));
  });

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-foreground/70">
        No classes recorded for this section.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="min-w-[760px] w-full text-sm">
        <thead className="bg-slate-100 text-left text-xs uppercase text-slate-700">
          <tr>
            <th className="px-3 py-2">Course</th>
            <th className="px-3 py-2">Instructor</th>
            <th className="px-3 py-2">Day</th>
            <th className="px-3 py-2">Time</th>
            <th className="px-3 py-2">Room</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ classRow, session, key }) => (
            <tr key={key} className="border-t">
              <td className="px-3 py-2">
                {classRow.course_code} — {classRow.course_title}
              </td>
              <td className="px-3 py-2">
                {classRow.instructor_name ?? (
                  <span className="text-foreground/50">Unassigned</span>
                )}
              </td>
              <td className="px-3 py-2">{session?.day ?? "TBA"}</td>
              <td className="px-3 py-2">
                {session
                  ? `${formatTimeOfDay(session.start_time)} – ${formatTimeOfDay(session.end_time)}`
                  : "TBA"}
              </td>
              <td className="px-3 py-2">
                {session?.room_code
                  ? `${session.room_code}${session.room_name ? ` (${session.room_name})` : ""}`
                  : "TBA"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
