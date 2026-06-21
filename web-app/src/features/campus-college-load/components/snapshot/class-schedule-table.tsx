import { formatNumber } from "@/features/campus-college-load/utils/format-number";
import type { CampusCollegeLoadSnapshotClass } from "@/features/shared/types/models";

export const ClassScheduleTable = ({
  classes,
  collegeCode,
  legacy,
}: {
  classes: CampusCollegeLoadSnapshotClass[];
  collegeCode: string | null;
  legacy: boolean;
}) => {
  if (legacy) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-foreground/70">
        Class schedule data is not available for this older revision.
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-foreground/70">
        No classes recorded for this scope.
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-semibold mb-2">Class Schedule</h3>
      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-[860px] w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-700">
            <tr>
              <th className="px-3 py-2">Class Code</th>
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Section</th>
              <th className="px-3 py-2">Instructor</th>
              <th className="px-3 py-2 text-right">Lecture Hours</th>
              <th className="px-3 py-2 text-right">Lab Hours</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((classRow) => (
              <tr key={classRow.class_id} className="border-t">
                <td className="px-3 py-2">{classRow.class_code}</td>
                <td className="px-3 py-2">
                  {classRow.course_code} — {classRow.course_title}
                </td>
                <td className="px-3 py-2">{classRow.section_code ?? "N/A"}</td>
                <td className="px-3 py-2">
                  {classRow.instructor_name ?? (
                    <span className="text-foreground/50">Unassigned</span>
                  )}
                  {classRow.instructor_name &&
                  classRow.instructor_college_code &&
                  classRow.instructor_college_code !== collegeCode ? (
                    <span className="ml-2 rounded border border-amber-200 bg-amber-100 px-1 py-0.5 text-[10px] text-amber-900">
                      Other College
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatNumber(classRow.lecture_hours)}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatNumber(classRow.laboratory_hours)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
