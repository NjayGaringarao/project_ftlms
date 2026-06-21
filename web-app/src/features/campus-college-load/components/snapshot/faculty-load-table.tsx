import { formatNumber } from "@/features/campus-college-load/utils/format-number";
import type { CampusCollegeLoadSnapshotFaculty } from "@/features/shared/types/models";

const employmentStatusOrder = [
  "Regular",
  "Contract of Service",
  "Part-time",
  "Temporary",
];

const getFacultySummaryRow = (faculty: CampusCollegeLoadSnapshotFaculty) => {
  const lectureHours =
    faculty.lecture_hours ??
    faculty.classes.reduce(
      (sum, classRow) => sum + Number(classRow.lecture_unit ?? 0),
      0,
    );
  const laboratoryHours =
    faculty.laboratory_hours ??
    faculty.classes.reduce(
      (sum, classRow) => sum + Number(classRow.laboratory_unit ?? 0) * 3,
      0,
    );
  const preparationCount = faculty.preparation_count ?? faculty.classes.length;
  const equivalentUnits = faculty.equivalent_units ?? 0;
  const equivalentTeachingLoad = Number(faculty.equivalent_teaching_load ?? 0);
  const actualTeachingLoad = Number(faculty.actual_teaching_load ?? 0);
  const totalWorkingLoad =
    faculty.total_working_load ??
    equivalentTeachingLoad + actualTeachingLoad + equivalentUnits;

  return {
    designation_summary: faculty.designation_summary?.trim() || "N/A",
    lecture_hours: lectureHours,
    laboratory_hours: laboratoryHours,
    preparation_count: preparationCount,
    equivalent_units: equivalentUnits,
    equivalent_teaching_load: equivalentTeachingLoad,
    actual_teaching_load: actualTeachingLoad,
    total_working_load: totalWorkingLoad,
  };
};

const groupSnapshotFaculty = (faculty: CampusCollegeLoadSnapshotFaculty[]) => {
  const grouped = new Map<string, CampusCollegeLoadSnapshotFaculty[]>();
  faculty.forEach((row) => {
    const status = row.employment_status?.trim() || "Unspecified";
    grouped.set(status, [...(grouped.get(status) ?? []), row]);
  });

  return [
    ...employmentStatusOrder
      .filter((status) => grouped.has(status))
      .map((status) => ({ status, faculty: grouped.get(status) ?? [] })),
    ...Array.from(grouped.entries())
      .filter(([status]) => !employmentStatusOrder.includes(status))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([status, rows]) => ({ status, faculty: rows })),
  ];
};

export const FacultyLoadTable = ({
  faculty,
}: {
  faculty: CampusCollegeLoadSnapshotFaculty[];
}) => {
  const groups = groupSnapshotFaculty(faculty);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-foreground">Faculty Load</h3>
        <div className="hidden overflow-x-auto rounded-md border md:block">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase text-slate-700">
              <tr>
                <th className="w-12 px-3 py-2 text-center">No.</th>
                <th className="px-3 py-2">Name of Faculty</th>
                <th className="px-3 py-2">Designation</th>
                <th className="px-3 py-2 text-right">ETL</th>
                <th className="px-3 py-2 text-right">Lecture Hours</th>
                <th className="px-3 py-2 text-right">Lab Hours</th>
                <th className="px-3 py-2 text-right">No. of Preparation</th>
                <th className="px-3 py-2 text-right">Equivalent Units</th>
                <th className="px-3 py-2 text-right">ATL</th>
                <th className="px-3 py-2 text-right">TWL</th>
              </tr>
            </thead>
            {groups.map((group) => (
              <tbody key={group.status}>
                <tr className="border-t bg-slate-50">
                  <td colSpan={10} className="px-3 py-2 font-medium">
                    {group.status}
                  </td>
                </tr>
                {group.faculty.map((faculty, index) => {
                  const row = getFacultySummaryRow(faculty);
                  return (
                    <tr key={faculty.faculty_id} className="border-t">
                      <td className="px-3 py-2 text-center">{index + 1}</td>
                      <td className="px-3 py-2 font-medium">
                        {faculty.faculty_name}
                      </td>
                      <td className="px-3 py-2">{row.designation_summary}</td>
                      <td className="px-3 py-2 text-right">
                        {formatNumber(row.equivalent_teaching_load)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatNumber(row.lecture_hours)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatNumber(row.laboratory_hours)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatNumber(row.preparation_count)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatNumber(row.equivalent_units)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatNumber(row.actual_teaching_load)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatNumber(row.total_working_load)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </div>
      </div>
      <div className="space-y-3 md:hidden">
        {groups.map((group) => (
          <div key={group.status} className="space-y-2">
            <p className="text-sm font-semibold">{group.status}</p>
            {group.faculty.map((faculty, index) => {
              const row = getFacultySummaryRow(faculty);
              return (
                <div key={faculty.faculty_id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-foreground/50">
                        No. {index + 1}
                      </p>
                      <p className="font-medium">{faculty.faculty_name}</p>
                      <p className="text-xs text-foreground/60">
                        {row.designation_summary}
                      </p>
                    </div>
                    <p className="text-right text-sm font-semibold">
                      TWL {formatNumber(row.total_working_load)}
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <p>ETL: {formatNumber(row.equivalent_teaching_load)}</p>
                    <p>ATL: {formatNumber(row.actual_teaching_load)}</p>
                    <p>Lecture: {formatNumber(row.lecture_hours)}</p>
                    <p>Lab: {formatNumber(row.laboratory_hours)}</p>
                    <p>Preparations: {formatNumber(row.preparation_count)}</p>
                    <p>Eq Units: {formatNumber(row.equivalent_units)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
