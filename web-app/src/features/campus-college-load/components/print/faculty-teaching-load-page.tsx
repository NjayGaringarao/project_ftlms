import { PrmsuFormHeader } from "@/features/campus-college-load/components/print/prmsu-form-header";
import { PrmsuSignatureBlock } from "@/features/campus-college-load/components/print/prmsu-signature-block";
import { formatNumber } from "@/features/campus-college-load/utils/format-number";
import { formatTimeOfDay } from "@/utils/time";
import type {
  CampusCollegeLoadSnapshotClass,
  CampusCollegeLoadSnapshotFaculty,
  CampusCollegeLoadSnapshotMetadata,
  CampusCollegeLoadSnapshotSession,
} from "@/features/shared/types/models";

type SessionRow = {
  session: CampusCollegeLoadSnapshotSession | null;
  isLab: boolean;
  lecUnits: number;
  lecHrs: number;
  labUnits: number;
  labHrs: number;
  courseCode: string;
  courseTitle: string;
  room: string | null;
  courseYrSec: string;
};

const getSessionDurationHours = (session: CampusCollegeLoadSnapshotSession): number => {
  const [sh, sm] = session.start_time.split(":").map(Number);
  const [eh, em] = session.end_time.split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
};

const buildSessionRows = (
  faculty: CampusCollegeLoadSnapshotFaculty,
  classMap: Map<string, CampusCollegeLoadSnapshotClass>,
): SessionRow[] => {
  const rows: SessionRow[] = [];

  for (const fc of faculty.classes) {
    const classData = classMap.get(fc.id);
    const sessions = classData?.sessions ?? [];
    const lecHrsTotal = fc.lecture_hours ?? 0;
    const labHrsTotal = fc.laboratory_hours ?? 0;
    const lecUnits = Number(fc.lecture_unit ?? 0);
    const labUnits = Number(fc.laboratory_unit ?? 0);
    const courseCode = fc.course_code;
    const courseTitle = fc.course_title;
    const courseYrSec = fc.year_section;

    if (sessions.length === 0) {
      rows.push({
        session: null,
        isLab: false,
        lecUnits,
        lecHrs: lecHrsTotal,
        labUnits,
        labHrs: labHrsTotal,
        courseCode,
        courseTitle,
        room: null,
        courseYrSec,
      });
      continue;
    }

    for (const session of sessions) {
      const dur = getSessionDurationHours(session);
      let isLab = false;
      if (labHrsTotal > 0 && lecHrsTotal > 0) {
        isLab = Math.abs(dur - labHrsTotal) < 0.1;
      } else if (labHrsTotal > 0 && lecHrsTotal === 0) {
        isLab = true;
      }

      const sessionLecHrs = isLab ? 0 : dur;
      const sessionLabHrs = isLab ? dur : 0;

      rows.push({
        session,
        isLab,
        lecUnits: isLab ? 0 : lecUnits,
        lecHrs: sessionLecHrs,
        labUnits: isLab ? labUnits : 0,
        labHrs: sessionLabHrs,
        courseCode,
        courseTitle,
        room: session.room_code,
        courseYrSec,
      });
    }
  }

  return rows;
};

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex gap-1 text-[9px] leading-tight">
    <span className="font-semibold whitespace-nowrap">{label}:</span>
    <span>{value}</span>
  </div>
);

export const FacultyTeachingLoadPage = ({
  metadata,
  faculty,
  classMap,
  semesterLabel,
}: {
  metadata: CampusCollegeLoadSnapshotMetadata;
  faculty: CampusCollegeLoadSnapshotFaculty;
  classMap: Map<string, CampusCollegeLoadSnapshotClass>;
  semesterLabel: string;
}) => {
  const sessionRows = buildSessionRows(faculty, classMap);
  const lectureHours =
    faculty.lecture_hours ??
    faculty.classes.reduce((sum, c) => sum + Number(c.lecture_unit ?? 0), 0);
  const laboratoryHours =
    faculty.laboratory_hours ??
    faculty.classes.reduce((sum, c) => sum + Number(c.laboratory_unit ?? 0) * 3, 0);
  const preparationCount = faculty.preparation_count ?? faculty.classes.length;
  const equivalentUnits = faculty.equivalent_units ?? 0;
  const etl = Number(faculty.equivalent_teaching_load ?? 0);
  const atl = Number(faculty.actual_teaching_load ?? 0);
  const twl = Number(faculty.total_working_load ?? (etl + atl + equivalentUnits));

  return (
    <div className="bg-white p-4 text-black font-sans text-[10px]">
      <PrmsuFormHeader
        documentTitle="FACULTY TEACHING LOAD"
        subtitle={semesterLabel}
        collegeName={metadata.college_name}
        campusName={metadata.campus_name}
      />

      <div className="flex gap-3">
        {/* Left sidebar */}
        <div className="w-44 flex-shrink-0 border border-gray-400 p-2 flex flex-col gap-1">
          <InfoRow label="Campus" value={metadata.campus_name ?? "—"} />
          <InfoRow label="Address" value={metadata.campus_name ? `${metadata.campus_name}, Zambales` : "—"} />
          <InfoRow label="College" value={metadata.college_code ?? "—"} />

          <div className="my-1 border-t border-gray-300" />

          <p className="font-bold text-sm leading-tight">{faculty.faculty_name}</p>
          <p className="text-[9px] text-gray-500 mb-1">Name of Faculty</p>
          <p className="text-[9px] italic">Note: Do not leave each item blank.</p>

          <div className="mt-1 flex flex-col gap-0.5">
            <InfoRow label="Employment Status" value={faculty.employment_status ?? "UNKNOWN"} />
            <InfoRow label="VSL" value="UNKNOWN" />
            <InfoRow label="Academic Rank" value={faculty.academic_rank ?? "UNKNOWN"} />
            <InfoRow label="Bachelor's Degree" value="UNKNOWN" />
            <InfoRow label="Master's Degree" value="UNKNOWN" />
            <InfoRow label="Doctorate Degree" value="UNKNOWN" />
            <InfoRow label="Post Doctorate Degree" value="UNKNOWN" />
            <InfoRow label="Designation" value={faculty.designation_summary?.trim() || "—"} />
          </div>

          <div className="mt-1 border-t border-gray-300" />

          <div className="flex flex-col gap-0.5 mt-1">
            <InfoRow label="Equiv. Teaching Load (ETL)" value={formatNumber(etl)} />
            <InfoRow label="Total Lecture Hours" value={formatNumber(lectureHours)} />
            <InfoRow label="Total Laboratory Hours" value={formatNumber(laboratoryHours)} />
            <InfoRow label="Total Lab/RLE Hours (×0.75)" value={formatNumber(laboratoryHours * 0.75)} />
            <InfoRow label="No. of Preparation" value={formatNumber(preparationCount)} />
            <InfoRow label="Advisory Class" value="UNKNOWN" />
            <InfoRow label="Equiv. Unit/s for No. of Prep." value={formatNumber(equivalentUnits)} />
            <InfoRow label="Actual Teaching Loads (ATL)" value={formatNumber(atl)} />
            <InfoRow label="Total Working Load (ETL+ATL)" value={formatNumber(twl)} />
            <InfoRow label="Excess (24 Hours)" value="—" />
          </div>

          <div className="mt-2 border-t border-gray-300 pt-1">
            <p className="text-[9px]">Received [Affix Faculty Signature]:</p>
          </div>
        </div>

        {/* Right: class schedule table */}
        <div className="flex-1 min-w-0">
          <table className="w-full border-collapse border border-gray-400 text-[9px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-1 py-0.5" rowSpan={2}>Time</th>
                <th className="border border-gray-400 px-1 py-0.5" rowSpan={2}>Day/s</th>
                <th className="border border-gray-400 px-1 py-0.5" rowSpan={2}>Course Code and Title</th>
                <th className="border border-gray-400 px-1 py-0.5 text-center" colSpan={2}>Lec.</th>
                <th className="border border-gray-400 px-1 py-0.5 text-center" colSpan={2}>Lab./RLE</th>
                <th className="border border-gray-400 px-1 py-0.5" rowSpan={2}>Room</th>
                <th className="border border-gray-400 px-1 py-0.5" rowSpan={2}>Course/<br />Yr./Sec.</th>
                <th className="border border-gray-400 px-1 py-0.5" rowSpan={2}>No. of<br />Students</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-1 py-0.5 text-center">Units</th>
                <th className="border border-gray-400 px-1 py-0.5 text-center">Hrs.</th>
                <th className="border border-gray-400 px-1 py-0.5 text-center">Units</th>
                <th className="border border-gray-400 px-1 py-0.5 text-center">Hrs.</th>
              </tr>
            </thead>
            <tbody>
              {sessionRows.map((row, i) => {
                const timeStr = row.session
                  ? `${formatTimeOfDay(row.session.start_time)}–${formatTimeOfDay(row.session.end_time)}`
                  : "TBA";
                const dayStr = row.session
                  ? `${row.session.day}(${row.session.type})`
                  : "TBA";
                return (
                  <tr key={i} className="border-t border-gray-300">
                    <td className="border border-gray-400 px-1 py-0.5 whitespace-nowrap">{timeStr}</td>
                    <td className="border border-gray-400 px-1 py-0.5 whitespace-nowrap">{dayStr}</td>
                    <td className="border border-gray-400 px-1 py-0.5">{row.courseCode}: {row.courseTitle}</td>
                    <td className="border border-gray-400 px-1 py-0.5 text-center">
                      {row.lecUnits > 0 ? formatNumber(row.lecUnits) : ""}
                    </td>
                    <td className="border border-gray-400 px-1 py-0.5 text-center">
                      {row.lecHrs > 0 ? formatNumber(row.lecHrs) : ""}
                    </td>
                    <td className="border border-gray-400 px-1 py-0.5 text-center">
                      {row.labUnits > 0 ? formatNumber(row.labUnits) : ""}
                    </td>
                    <td className="border border-gray-400 px-1 py-0.5 text-center">
                      {row.labHrs > 0 ? formatNumber(row.labHrs) : ""}
                    </td>
                    <td className="border border-gray-400 px-1 py-0.5">{row.room ?? "TBA"}</td>
                    <td className="border border-gray-400 px-1 py-0.5">{row.courseYrSec}</td>
                    <td className="border border-gray-400 px-1 py-0.5 text-center">UNKNOWN</td>
                  </tr>
                );
              })}
              {/* Blank rows for the official form look */}
              {Array.from({ length: Math.max(0, 5 - sessionRows.length) }).map((_, i) => (
                <tr key={`blank-${i}`}>
                  <td className="border border-gray-400 px-1 py-1" colSpan={10}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          <PrmsuSignatureBlock
            preparedBy="UNKNOWN"
            recommendingApproval="UNKNOWN"
            approvedBy="UNKNOWN"
          />
        </div>
      </div>
    </div>
  );
};
