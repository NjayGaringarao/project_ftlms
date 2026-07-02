import { PrmsuFormHeader } from "@/features/campus-college-load/components/print/prmsu-form-header";
import { formatNumber } from "@/features/campus-college-load/utils/format-number";
import { formatTimeOfDay } from "@/utils/time";
import type {
  CampusCollegeLoadSnapshotClass,
  CampusCollegeLoadSnapshotMetadata,
  CampusCollegeLoadSnapshotSection,
  CampusCollegeLoadSnapshotSession,
} from "@/features/shared/types/models";
import InfoRow from "./info-row";

const DAY_ABBREV: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thurs",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const DAY_ORDER: Record<string, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

const abbreviateDay = (day: string): string =>
  DAY_ABBREV[day.toLowerCase()] ?? day;

const deriveDeliveryMode = (
  roomCode: string | null,
  hasSession: boolean,
): "F2F" | "OL" | "TBA" => {
  if (!hasSession) return "TBA";
  if (!roomCode || roomCode.trim() === "" || roomCode.toUpperCase() === "TBA")
    return "OL";
  if (roomCode.toUpperCase().includes("OL")) return "OL";
  return "F2F";
};

type ScheduleRow = {
  session: CampusCollegeLoadSnapshotSession | null;
  classRow: CampusCollegeLoadSnapshotClass;
  lecHours: number;
  lecRoom: string | null;
  labHours: number;
  labRoom: string | null;
};

const buildScheduleRows = (
  classes: CampusCollegeLoadSnapshotClass[],
): ScheduleRow[] => {
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

  return rows.sort((a, b) => {
    if (!a.session && !b.session) return 0;
    if (!a.session) return 1;
    if (!b.session) return -1;
    const dayDiff =
      (DAY_ORDER[a.session.day.toLowerCase()] ?? 99) -
      (DAY_ORDER[b.session.day.toLowerCase()] ?? 99);
    if (dayDiff !== 0) return dayDiff;
    return a.session.start_time.localeCompare(b.session.start_time);
  });
};

export const ClassScheduleSectionPage = ({
  metadata,
  section,
  classes,
  semesterLabel,
  collegeLogoUrl,
}: {
  metadata: CampusCollegeLoadSnapshotMetadata;
  section: CampusCollegeLoadSnapshotSection;
  classes: CampusCollegeLoadSnapshotClass[];
  semesterLabel: string;
  collegeLogoUrl?: string | null;
}) => {
  const scheduleRows = buildScheduleRows(classes);
  const totalLecHours = classes.reduce(
    (sum, c) => sum + (c.lecture_hours ?? 0),
    0,
  );
  const totalLabHours = classes.reduce(
    (sum, c) => sum + (c.laboratory_hours ?? 0),
    0,
  );

  return (
    <div className="bg-white p-4 text-black font-sans text-[10px]">
      <PrmsuFormHeader
        documentTitle="CLASS SCHEDULE"
        subtitle={semesterLabel}
        collegeName={metadata.college_name}
        campusName={metadata.campus_name}
        collegeLogoUrl={collegeLogoUrl}
      />

      <div className="flex">
        {/* Left sidebar */}

        <div className="w-1/4 shrink-0 border-2 border-gray-900 flex flex-col">
          <div className="flex flex-col h-14 border-b-2 border-gray-900">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col style={{ width: "55%" }} />
                <col style={{ width: "8%" }} />
                <col />
              </colgroup>
              <tbody>
                <InfoRow label="Campus" value={metadata.campus_name ?? "—"} />
                <InfoRow
                  label="Address"
                  value={
                    metadata.campus_name
                      ? `${metadata.campus_name}, Zambales`
                      : "—"
                  }
                />
                <InfoRow label="College" value={metadata.college_code ?? "—"} />
              </tbody>
            </table>
          </div>
          <div className="flex flex-col h-14 border-b border-gray-600 items-center justify-center bg-neutral-100">
            <p className="text-[18px] font-black leading-tight">
              {section.section_code}
            </p>
          </div>

          <div className="h-4 flex flex-col items-center bg-neutral-400 border-b-2 border-gray-900">
            <p className="text-[9px] text-white font-bold">
              CLASS [COURSE/YEAR/SECTION]
            </p>
          </div>

          <table className="mt-4 w-full table-fixed border-collapse">
            <colgroup>
              <col style={{ width: "55%" }} />
              <col style={{ width: "8%" }} />
              <col />
            </colgroup>
            <tbody>
              <InfoRow
                label="Number of Student"
                value={
                  section.student_count != null
                    ? String(section.student_count)
                    : "—"
                }
              />
              <InfoRow label="Adviser" value={section.adviser_name ?? "—"} />
              <InfoRow
                label="Total Lecture Class Hours"
                value={formatNumber(totalLecHours)}
              />
              <InfoRow
                label="Total Laboratory Class Hours"
                value={formatNumber(totalLabHours)}
              />
              <InfoRow
                label="Total Class Hours/Week"
                value={formatNumber(totalLecHours + totalLabHours)}
              />
            </tbody>
          </table>
        </div>
        <div className="w-3 bg-neutral-400 border-y-2 border-gray-900" />

        {/* Right: schedule table */}
        <div className="flex-1 min-w-0 border-2 border-gray-900 overflow-hidden">
          <table
            className="w-full border-collapse text-[9px]"
            style={{ margin: "-2px", width: "calc(100% + 4px)" }}
          >
            <colgroup>
              <col className="w-24" />
              <col className="w-14" />
              <col />
              <col className="w-8" />
              <col className="w-16" />
              <col className="w-8" />
              <col className="w-16" />
              <col className="w-32" />
            </colgroup>
            <thead>
              <tr className="bg-neutral-100">
                <th className="border-2 border-gray-900 px-1 py-0.5">Time</th>
                <th className="border-2 border-gray-900 px-1 py-0.5">Day/s</th>
                <th className="border-2 border-gray-900 px-1 py-0.5">
                  Course Code and Title
                </th>
                <th className="border-2 border-gray-900 px-1 py-0.5 text-center">
                  Lec. Hours
                </th>
                <th className="border-2 border-gray-900 px-1 py-0.5 text-center">
                  Lec. Room
                </th>
                <th className="border-2 border-gray-900 px-1 py-0.5 text-center">
                  Lab. Hours
                </th>
                <th className="border-2 border-gray-900 px-1 py-0.5 text-center">
                  Lab. Room
                </th>
                <th className="border-2 border-gray-900 px-1 py-0.5">
                  Instructor
                </th>
              </tr>
            </thead>
            <tbody>
              {scheduleRows.map((row, i) => {
                const timeStr = row.session
                  ? `${formatTimeOfDay(row.session.start_time)}–${formatTimeOfDay(row.session.end_time)}`
                  : "TBA";
                const deliveryMode = deriveDeliveryMode(
                  row.session?.room_code ?? null,
                  row.session !== null,
                );
                const dayStr = row.session
                  ? `${abbreviateDay(row.session.day)}(${deliveryMode})`
                  : "TBA";
                return (
                  <tr key={i}>
                    <td className="border border-gray-900 px-1 py-0.5 whitespace-nowrap">
                      {timeStr}
                    </td>
                    <td className="border border-gray-900 px-1 py-0.5 whitespace-nowrap">
                      {dayStr}
                    </td>
                    <td className="border border-gray-900 px-1 py-0.5">
                      {row.classRow.course_code}: {row.classRow.course_title}
                    </td>
                    <td className="border border-gray-900 px-1 py-0.5 text-center">
                      {row.lecHours > 0 ? formatNumber(row.lecHours) : ""}
                    </td>
                    <td className="border border-gray-900 px-1 py-0.5 text-center">
                      {row.lecHours > 0
                        ? row.session === null
                          ? "TBA"
                          : (row.lecRoom ?? "Online")
                        : ""}
                    </td>
                    <td className="border border-gray-900 px-1 py-0.5 text-center">
                      {row.labHours > 0 ? formatNumber(row.labHours) : ""}
                    </td>
                    <td className="border border-gray-900 px-1 py-0.5 text-center">
                      {row.labHours > 0
                        ? row.session === null
                          ? "TBA"
                          : (row.labRoom ?? "Online")
                        : ""}
                    </td>
                    <td className="border border-gray-900 px-1 py-0.5">
                      {row.classRow.instructor_name ?? "TBA"}
                    </td>
                  </tr>
                );
              })}
              {/* Blank rows */}
              {Array.from({
                length: Math.max(0, 10 - scheduleRows.length),
              }).map((_, i) => (
                <tr key={`blank-${i}`}>
                  <td className="border border-gray-300 px-1 py-1" colSpan={8}>
                    &nbsp;
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <table className="w-96 mt-2">
          <tbody>
            <tr className="text-[9px] text-start">
              <td className="w-1/3">Prepared by:</td>
            </tr>
            <tr className="text-xs text-center">
              <td className="w-1/3">
                <p className="font-bold mt-4">
                  {section.program_chair_name ?? ""}
                </p>
                <p className="text-[10px]">Program Chairperson</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
