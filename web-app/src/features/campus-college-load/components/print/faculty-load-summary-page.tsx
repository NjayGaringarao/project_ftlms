import { PrmsuFormHeader } from "@/features/campus-college-load/components/print/prmsu-form-header";
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
  collegeLogoUrl,
}: {
  metadata: CampusCollegeLoadSnapshotMetadata;
  faculty: CampusCollegeLoadSnapshotFaculty[];
  programName?: string | null;
  collegeLogoUrl?: string | null;
}) => {
  const groups = groupFaculty(faculty);
  const semesterLabel = [
    metadata.academic_term_name,
    metadata.academic_year_code,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="bg-white p-6 text-black min-h-screen font-sans">
      <PrmsuFormHeader
        documentTitle="FACULTY TEACHING LOAD"
        subtitle={semesterLabel}
        collegeName={metadata.college_name}
        campusName={metadata.campus_name}
        collegeLogoUrl={collegeLogoUrl}
      />

      {programName ? (
        <p className="text-center text-xs font-semibold mb-2">{programName}</p>
      ) : null}

      {groups.map((group) => (
        <div key={group.status} className="overflow-x-auto mt-4">
          <table className="w-full text-[9px] border-collapse border border-gray-900">
            <thead>
              <tr className="bg-neutral-400">
                <th className="border border-gray-900 px-1.5 py-1 text-center w-8">
                  NO
                </th>
                <th className="w-44 border border-gray-900 px-1.5 py-1 text-left">
                  NAME OF FACULTY ({group.status.toUpperCase()})
                </th>
                <th className="border border-gray-900 px-1.5 py-1 text-left">
                  DESIGNATION
                </th>
                <th className="w-20 border border-gray-900 px-1.5 py-1 text-center">
                  EQUIVALENT TEACHING LOAD
                </th>
                <th className="w-20 border border-gray-900 px-1.5 py-1 text-center">
                  LECTURE HOURS
                </th>
                <th className="w-20 border border-gray-900 px-1.5 py-1 text-center">
                  LAB HOURS (×.75)
                </th>
                <th className="w-20 border border-gray-900 px-1.5 py-1 text-center">
                  NO. OF PREPARATION
                </th>
                <th className="w-20 border border-gray-900 px-1.5 py-1 text-center">
                  EQUIVALENT UNITS
                </th>
                <th className="w-20 border border-gray-900 px-1.5 py-1 text-center">
                  ACTUAL TEACHING LOAD
                </th>
                <th className="w-20 border border-gray-900 px-1.5 py-1 text-center">
                  TOTAL WORKING LOAD
                </th>
              </tr>
            </thead>
            <tbody>
              {group.faculty.map((f, i) => {
                const labHoursWeighted =
                  (f.laboratory_hours ??
                    f.classes.reduce(
                      (sum, c) => sum + Number(c.laboratory_unit ?? 0) * 3,
                      0,
                    )) * 0.75;
                return (
                  <tr key={f.faculty_id} className="border-t border-gray-900">
                    <td className="border border-gray-900 px-1.5 py-1 text-center">
                      {i + 1}
                    </td>
                    <td className="border border-gray-900 px-1.5 py-1 font-medium">
                      {f.faculty_name}
                    </td>
                    <td className="border border-gray-900 px-1.5 py-1">
                      {f.designation_summary?.trim() || "—"}
                    </td>
                    <td className="border border-gray-900 px-1.5 py-1 text-center">
                      {formatNumber(Number(f.equivalent_teaching_load ?? 0))}
                    </td>
                    <td className="border border-gray-900 px-1.5 py-1 text-center">
                      {formatNumber(
                        f.lecture_hours ??
                          f.classes.reduce(
                            (sum, c) => sum + Number(c.lecture_unit ?? 0),
                            0,
                          ),
                      )}
                    </td>
                    <td className="border border-gray-900 px-1.5 py-1 text-center">
                      {formatNumber(labHoursWeighted)}
                    </td>
                    <td className="border border-gray-900 px-1.5 py-1 text-center">
                      {formatNumber(f.preparation_count ?? f.classes.length)}
                    </td>
                    <td className="border border-gray-900 px-1.5 py-1 text-center">
                      {formatNumber(f.equivalent_units ?? 0)}
                    </td>
                    <td className="border border-gray-900 px-1.5 py-1 text-center">
                      {formatNumber(Number(f.actual_teaching_load ?? 0))}
                    </td>
                    <td className="borderf border-gray-900 px-1.5 py-1 text-center">
                      {formatNumber(Number(f.total_working_load ?? 0))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      <table className="w-full border-collapse mt-4">
        <tbody>
          <tr className="text-[9px] text-start">
            <td className="w-1/3">Prepared:</td>
            <td className="w-1/3">Recommending Approval:</td>
            <td className="w-1/3">Approved:</td>
          </tr>
          <tr className="text-xs text-center">
            <td className="w-1/3">
              <p className="font-bold mt-4">{metadata.prepared_by ?? ""}</p>
              <p className="text-[10px]">Campus Director</p>
            </td>
            <td className="w-1/3">
              <p className="font-bold mt-4">
                {metadata.recommending_approval ?? ""}
              </p>
              <p className="text-[10px]">Director for Instruction</p>
            </td>
            <td className="w-1/3">
              <p className="font-bold mt-4">{metadata.approved_by ?? ""}</p>
              <p className="text-[10px]">Vice President for Academic Affairs</p>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="self-end mt-2 w-full flex flex-col items-end pr-15 pt-4">
        <div className="text-[8.5px]">
          <p>Reference no.: PRMSU-ASA-COMSP18 (1a)</p>
          <p>Effectivity date: May 04, 2021</p>
          <p>Revision no.: 00</p>
        </div>
      </div>
    </div>
  );
};
