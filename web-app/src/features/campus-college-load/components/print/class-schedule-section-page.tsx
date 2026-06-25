import { PrmsuFormHeader } from "@/features/campus-college-load/components/print/prmsu-form-header";
import { PrmsuSignatureBlock } from "@/features/campus-college-load/components/print/prmsu-signature-block";
import { formatNumber } from "@/features/campus-college-load/utils/format-number";
import { formatTimeOfDay } from "@/utils/time";
import type {
  CampusCollegeLoadSnapshotClass,
  CampusCollegeLoadSnapshotMetadata,
  CampusCollegeLoadSnapshotSection,
  CampusCollegeLoadSnapshotSession,
} from "@/features/shared/types/models";

type ScheduleRow = {
  session: CampusCollegeLoadSnapshotSession | null;
  classRow: CampusCollegeLoadSnapshotClass;
  lecHours: number;
  lecRoom: string | null;
  labHours: number;
  labRoom: string | null;
};

const buildScheduleRows = (classes: CampusCollegeLoadSnapshotClass[]): ScheduleRow[] => {
  const rows: ScheduleRow[] = [];

  for (const classRow of classes) {
    if (classRow.sessions.length === 0) {
      rows.push({
        session: null,
        classRow,
        lecHours: classRow.lecture_hours ?? 0,
        lecRoom: null,
        labHours: classRow.laboratory_hours ?? 0,
        labRoom: null,
      });
      continue;
    }

    const labHrsTotal = classRow.laboratory_hours ?? 0;
    const lecHrsTotal = classRow.lecture_hours ?? 0;

    for (const session of classRow.sessions) {
      const [sh, sm] = session.start_time.split(":").map(Number);
      const [eh, em] = session.end_time.split(":").map(Number);
      const dur = (eh * 60 + em - (sh * 60 + sm)) / 60;

      let isLab = false;
      if (labHrsTotal > 0 && lecHrsTotal > 0) {
        isLab = Math.abs(dur - labHrsTotal) < 0.1;
      } else if (labHrsTotal > 0 && lecHrsTotal === 0) {
        isLab = true;
      }

      rows.push({
        session,
        classRow,
        lecHours: isLab ? 0 : dur,
        lecRoom: isLab ? null : session.room_code,
        labHours: isLab ? dur : 0,
        labRoom: isLab ? session.room_code : null,
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

export const ClassScheduleSectionPage = ({
  metadata,
  section,
  classes,
  semesterLabel,
}: {
  metadata: CampusCollegeLoadSnapshotMetadata;
  section: CampusCollegeLoadSnapshotSection;
  classes: CampusCollegeLoadSnapshotClass[];
  semesterLabel: string;
}) => {
  const scheduleRows = buildScheduleRows(classes);
  const totalLecHours = classes.reduce((sum, c) => sum + (c.lecture_hours ?? 0), 0);
  const totalLabHours = classes.reduce((sum, c) => sum + (c.laboratory_hours ?? 0), 0);

  return (
    <div className="bg-white p-4 text-black font-sans text-[10px]">
      <PrmsuFormHeader
        documentTitle="CLASS SCHEDULE"
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

          <div className="my-2 border-t border-gray-300" />

          <p className="font-bold text-xl leading-tight text-center">{section.section_code}</p>
          <p className="text-[8px] text-gray-500 text-center mb-1">CLASS: [COURSE/YEAR/SECTION]</p>

          <div className="mt-1 flex flex-col gap-0.5">
            <InfoRow label="Number of Student" value="UNKNOWN" />
            <InfoRow label="Adviser" value="UNKNOWN" />
            <InfoRow label="Total Lecture Class Hours" value={formatNumber(totalLecHours)} />
            <InfoRow label="Total Laboratory Class Hours" value={formatNumber(totalLabHours)} />
            <InfoRow label="Total Class Hours/Week" value={formatNumber(totalLecHours + totalLabHours)} />
          </div>
        </div>

        {/* Right: schedule table */}
        <div className="flex-1 min-w-0">
          <table className="w-full border-collapse border border-gray-400 text-[9px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-1 py-0.5">Time</th>
                <th className="border border-gray-400 px-1 py-0.5">Day/s</th>
                <th className="border border-gray-400 px-1 py-0.5">Course Code and Title</th>
                <th className="border border-gray-400 px-1 py-0.5 text-center">Lec. Hours</th>
                <th className="border border-gray-400 px-1 py-0.5 text-center">Lec. Room</th>
                <th className="border border-gray-400 px-1 py-0.5 text-center">Lab. Hours</th>
                <th className="border border-gray-400 px-1 py-0.5 text-center">Lab. Room</th>
                <th className="border border-gray-400 px-1 py-0.5">Instructor</th>
              </tr>
            </thead>
            <tbody>
              {scheduleRows.map((row, i) => {
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
                    <td className="border border-gray-400 px-1 py-0.5">{row.classRow.course_code}: {row.classRow.course_title}</td>
                    <td className="border border-gray-400 px-1 py-0.5 text-center">
                      {row.lecHours > 0 ? formatNumber(row.lecHours) : ""}
                    </td>
                    <td className="border border-gray-400 px-1 py-0.5 text-center">{row.lecRoom ?? ""}</td>
                    <td className="border border-gray-400 px-1 py-0.5 text-center">
                      {row.labHours > 0 ? formatNumber(row.labHours) : ""}
                    </td>
                    <td className="border border-gray-400 px-1 py-0.5 text-center">{row.labRoom ?? ""}</td>
                    <td className="border border-gray-400 px-1 py-0.5">
                      {row.classRow.instructor_name ?? <span className="text-gray-400">Unassigned</span>}
                    </td>
                  </tr>
                );
              })}
              {/* Blank rows */}
              {Array.from({ length: Math.max(0, 5 - scheduleRows.length) }).map((_, i) => (
                <tr key={`blank-${i}`}>
                  <td className="border border-gray-400 px-1 py-1" colSpan={8}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          <PrmsuSignatureBlock
            preparedBy="UNKNOWN"
            recommendingApproval="UNKNOWN"
            approvedBy="UNKNOWN"
            preparedByTitle="Program Chairperson"
            recommendingApprovalTitle=""
            approvedByTitle=""
          />
        </div>
      </div>
    </div>
  );
};
