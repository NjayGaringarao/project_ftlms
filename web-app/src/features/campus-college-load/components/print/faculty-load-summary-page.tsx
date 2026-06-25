import { PrmsuFormHeader } from "@/features/campus-college-load/components/print/prmsu-form-header";
import { PrmsuSignatureBlock } from "@/features/campus-college-load/components/print/prmsu-signature-block";
import { formatNumber } from "@/features/campus-college-load/utils/format-number";
import type {
  CampusCollegeLoadSnapshotFaculty,
  CampusCollegeLoadSnapshotMetadata,
} from "@/features/shared/types/models";

const employmentStatusOrder = [
  "Regular",
  "Contract of Service",
  "Part-time",
  "Temporary",
];

const groupFaculty = (faculty: CampusCollegeLoadSnapshotFaculty[]) => {
  const grouped = new Map<string, CampusCollegeLoadSnapshotFaculty[]>();
  faculty.forEach((row) => {
    const status = row.employment_status?.trim() || "Unspecified";
    grouped.set(status, [...(grouped.get(status) ?? []), row]);
  });
  return [
    ...employmentStatusOrder
      .filter((s) => grouped.has(s))
      .map((s) => ({ status: s, faculty: grouped.get(s)! })),
    ...Array.from(grouped.entries())
      .filter(([s]) => !employmentStatusOrder.includes(s))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([status, rows]) => ({ status, faculty: rows })),
  ];
};

export const FacultyLoadSummaryPage = ({
  metadata,
  faculty,
  programName,
}: {
  metadata: CampusCollegeLoadSnapshotMetadata;
  faculty: CampusCollegeLoadSnapshotFaculty[];
  programName?: string | null;
}) => {
  const groups = groupFaculty(faculty);
  const semesterLabel = [metadata.academic_term_name, metadata.academic_year_code]
    .filter(Boolean)
    .join(", ");

  // Flatten with stable global indices before render
  const indexedFaculty = groups.flatMap((group) =>
    group.faculty.map((f, groupIdx) => ({
      faculty: f,
      group: group.status,
      globalIdx:
        groups
          .slice(0, groups.indexOf(group))
          .reduce((sum, g) => sum + g.faculty.length, 0) + groupIdx + 1,
    })),
  );

  return (
    <div className="bg-white p-6 text-black min-h-screen font-sans">
      <PrmsuFormHeader
        documentTitle="FACULTY TEACHING LOAD"
        subtitle={semesterLabel}
        collegeName={metadata.college_name}
        campusName={metadata.campus_name}
      />

      {programName ? (
        <p className="text-center text-xs font-semibold mb-2">{programName}</p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-[10px] border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-1.5 py-1 text-center w-8">NO</th>
              <th className="border border-gray-400 px-1.5 py-1 text-left">NAME OF FACULTY (REGULAR)</th>
              <th className="border border-gray-400 px-1.5 py-1 text-left">DESIGNATION</th>
              <th className="border border-gray-400 px-1.5 py-1 text-center">EQUIVALENT TEACHING LOAD</th>
              <th className="border border-gray-400 px-1.5 py-1 text-center">LECTURE HOURS</th>
              <th className="border border-gray-400 px-1.5 py-1 text-center">LAB HOURS (×.75)</th>
              <th className="border border-gray-400 px-1.5 py-1 text-center">NO. OF PREPARATION</th>
              <th className="border border-gray-400 px-1.5 py-1 text-center">EQUIVALENT UNITS</th>
              <th className="border border-gray-400 px-1.5 py-1 text-center">ACTUAL TEACHING LOAD</th>
              <th className="border border-gray-400 px-1.5 py-1 text-center">TOTAL WORKING LOAD</th>
            </tr>
          </thead>
          <tbody>
            {indexedFaculty.map(({ faculty: f, globalIdx }) => {
              const labHoursWeighted =
                (f.laboratory_hours ??
                  f.classes.reduce(
                    (sum, c) => sum + Number(c.laboratory_unit ?? 0) * 3,
                    0,
                  )) * 0.75;
              return (
                <tr key={f.faculty_id} className="border-t border-gray-300">
                  <td className="border border-gray-400 px-1.5 py-1 text-center">{globalIdx}</td>
                  <td className="border border-gray-400 px-1.5 py-1 font-medium">{f.faculty_name}</td>
                  <td className="border border-gray-400 px-1.5 py-1">{f.designation_summary?.trim() || "—"}</td>
                  <td className="border border-gray-400 px-1.5 py-1 text-center">
                    {formatNumber(Number(f.equivalent_teaching_load ?? 0))}
                  </td>
                  <td className="border border-gray-400 px-1.5 py-1 text-center">
                    {formatNumber(
                      f.lecture_hours ??
                        f.classes.reduce((sum, c) => sum + Number(c.lecture_unit ?? 0), 0),
                    )}
                  </td>
                  <td className="border border-gray-400 px-1.5 py-1 text-center">
                    {formatNumber(labHoursWeighted)}
                  </td>
                  <td className="border border-gray-400 px-1.5 py-1 text-center">
                    {formatNumber(f.preparation_count ?? f.classes.length)}
                  </td>
                  <td className="border border-gray-400 px-1.5 py-1 text-center">
                    {formatNumber(f.equivalent_units ?? 0)}
                  </td>
                  <td className="border border-gray-400 px-1.5 py-1 text-center">
                    {formatNumber(Number(f.actual_teaching_load ?? 0))}
                  </td>
                  <td className="border border-gray-400 px-1.5 py-1 text-center">
                    {formatNumber(Number(f.total_working_load ?? 0))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PrmsuSignatureBlock
        preparedBy="UNKNOWN"
        recommendingApproval="UNKNOWN"
        approvedBy="UNKNOWN"
      />
    </div>
  );
};
