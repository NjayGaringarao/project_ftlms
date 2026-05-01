import Image from "next/image";
import type { FacultyLoadExportDocument } from "@/features/document-export/lib/faculty-load-export/document";
import { dayLabel, toDisplayTime } from "@/features/scheduler/lib/schedule/utils";
import { cn } from "@/utils/style";
import styles from "./faculty-load-print-document.module.css";

type FacultyLoadPrintDocumentProps = {
  document: FacultyLoadExportDocument;
};

const formatHours = (value: number | null): string => {
  if (value === null) return "0";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.?0+$/, "");
};

const formatSignedName = (value: string | null): string => {
  if (!value) return " ";
  return value;
};

const toRowTime = (start: string, end: string): string => {
  return `${toDisplayTime(start)} - ${toDisplayTime(end)}`;
};

const formatGeneratedAt = (value: Date): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).formatToParts(value);

  const partMap = new Map(parts.map((part) => [part.type, part.value]));

  return `${partMap.get("month")}/${partMap.get("day")}/${partMap.get("year")} - ${partMap.get("hour")}:${partMap.get("minute")}:${partMap.get("second")} ${partMap.get("dayPeriod")}`;
};

const FacultyLoadPrintDocument = ({
  document,
}: FacultyLoadPrintDocumentProps) => {
  const scheduleRows = document.scheduleRows;
  const generatedAt = formatGeneratedAt(new Date());
  const detailsRows = [
    ["Employment Status", document.employmentStatus],
    ["Academic Rank", document.academicRank],
    ["Bachelor's Degree", document.bachelorsDegree],
    ["Master's Degree", document.mastersDegree],
    ["Doctorate Degree", document.doctorateDegree],
    ["Designation", document.designations],
    [
      "Equivalent Teaching Load (ETL)",
      document.equivalentTeachingLoad.toFixed(2),
    ],
    ["Total Lecture Hours", document.totalLectureHours.toFixed(2)],
    ["Total Lab. Hours", document.totalLabHours.toFixed(2)],
    ["Total Lab. Hours x 0.75", (document.totalLabHours * 0.75).toFixed(2)],
    ["Equiv. Unit's for No. of Prep.", document.equivalentPrepUnits.toFixed(2)],
    ["No. of Preparation", String(document.preparationCount)],
    ["Actual Teaching Loads (ATL)", document.actualTeachingLoad.toFixed(2)],
    ["Total Working Load (ETL+ATL)", document.totalWorkingLoad.toFixed(2)],
    ["Excess (24hrs)", document.excess24.toFixed(2)],
    ["Advisory Class", document.advisoryClass],
  ] as const;

  return (
    <article
      className={cn(
        styles.sheet,
        "mx-auto w-full max-w-310 border-[1.5px] border-[#111] bg-white text-[8px] text-[#111] font-['Arial Narrow','Helvetica_Neue',sans-serif]",
      )}
    >
      
      {/** Header */}
      <header className="grid grid-cols-[86px_1fr_86px] items-center border-b-[1.5px] border-[#111] px-4 pb-4 pt-2">
        <Image
          src="/prmsu.png"
          alt="PRMSU seal"
          width={128}
          height={128}
          priority
          className="size-15 justify-self-center object-contain"
        />
        <div className="text-center leading-[1.15]">
          <p className="m-0 text-[8px]">Republic of the Philippines</p>
          <p className="m-0 text-[8px] font-bold">
            PRESIDENT RAMON MAGSAYSAY STATE UNIVERSITY
          </p>
          <p className="mb-0.5 text-[8px]">
            (Formerly Ramon Magsaysay Technological University)
          </p>
          <p className="m-0 text-[10px] font-bold">
            FACULTY TEACHING LOAD
          </p>
          <p className="m-0 text-[8px] font-medium">
            {document.termDisplayName}, S.Y. {document.academicYearDisplay}
          </p>
        </div>
        <div className="size-14" />
      </header>

      {/** Content */}
      <div className="border border-[#666]">
        <section className="grid min-h-128 grid-cols-[25%_75%]">
          <aside className="flex flex-col border-r-4 border-[#666]">
            <table className="w-full text-[8px]">
              <tbody>
                <tr>
                  <td className="w-32 px-1 py-0.5 align-top font-bold">
                    Campus
                  </td>
                  <td className="w-3 px-1 py-0.5 text-center align-top">
                    :
                  </td>
                  <td className=" px-1 py-0.5 align-top">
                    {document.campusName}
                  </td>
                </tr>
                <tr>
                  <td className="w-32 px-1 py-0.5 align-top font-bold">
                    Address
                  </td>
                  <td className="w-3 px-1 py-0.5 text-center align-top">
                    :
                  </td>
                  <td className="px-1 py-0.5 align-top">
                    {document.campusAddress}
                  </td>
                </tr>
                <tr>
                  <td className="w-32 px-1 py-0.5 align-top font-bold">
                    College
                  </td>
                  <td className="w-3 px-1 py-0.5 text-center align-top">
                    :
                  </td>
                  <td className=" px-1 py-0.5 align-top">
                    {document.collegeName}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="flex min-h-5 flex-1 items-center justify-center border-y border-[#111] px-3 py-2 text-center text-[20px] leading-[1.15] font-medium uppercase">
              {document.facultyName}
            </div>
            <div className="border-b border-[#111] bg-[#b4b4b4] px-1 py-1 text-center text-[8px] font-bold text-white">
              Name of Faculty
            </div>

            <table className="w-full border-collapse text-[8px]">
              <tbody>
                {detailsRows.map(([label, value]) => (
                  <tr key={label}>
                    <td className="w-32 px-1 align-top font-bold">
                      {label}
                    </td>
                    <td className="w-2 px-1 text-center align-top">
                      :
                    </td>
                    <td className="px-1 align-top wrap whitespace-pre-line leading-[1.15]">
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </aside>

          <section className="flex flex-col">
            <table
              className={cn(
                styles.scheduleTable,
                "w-full border-collapse text-[8px]",
              )}
            >
              <colgroup>
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th className="border-r border-b border-[#111] bg-[#f1f1f1] px-1 py-1 text-center leading-tight font-bold">
                    Time
                  </th>
                  <th className="border-r border-b border-[#111] bg-[#f1f1f1] px-1 py-1 text-center leading-tight font-bold">
                    Day/s
                  </th>
                  <th className="border-r border-b border-[#111] bg-[#f1f1f1] px-1 py-1 text-center leading-tight font-bold">
                    Course Code and Title
                  </th>
                  <th className="border-r border-b border-[#111] bg-[#f1f1f1] px-1 py-1 text-center leading-tight font-bold">
                    Lec. Hours
                  </th>
                  <th className="border-r border-b border-[#111] bg-[#f1f1f1] px-1 py-1 text-center leading-tight font-bold">
                    Lec. Room
                  </th>
                  <th className="border-r border-b border-[#111] bg-[#f1f1f1] px-1 py-1 text-center leading-tight font-bold">
                    Lab. Hours
                  </th>
                  <th className="border-r border-b border-[#111] bg-[#f1f1f1] px-1 py-1 text-center leading-tight font-bold">
                    Lab. Room
                  </th>
                  <th className="border-r border-b border-[#111] bg-[#f1f1f1] px-1 py-1 text-center leading-tight font-bold">
                    Course/ Yr./Sec.
                  </th>
                  <th className="border-b border-[#111] bg-[#f1f1f1] px-1 py-1 text-center leading-tight font-bold">
                    No. of Students
                  </th>
                </tr>
              </thead>
              <tbody>
                {scheduleRows.length === 0 ? (
                  <tr>
                    <td
                      className="px-2 py-4 text-center italic text-[#666]"
                      colSpan={9}
                    >
                      No schedule rows available for this faculty and term.
                    </td>
                  </tr>
                ) : (
                  scheduleRows.map((row) => (
                    <tr key={row.row_id}>
                      <td className="border-r border-b border-[#111] px-1 py-2 text-center align-top leading-[1.3]">
                        {row.session
                          ? toRowTime(
                              row.session.start_time,
                              row.session.end_time,
                            )
                          : "-"}
                      </td>
                      <td className="border-r border-b border-[#111] px-1 py-2 text-center align-top leading-[1.2]">
                        {row.session_days.length > 0
                          ? row.session_days
                              .map((day) => dayLabel(day))
                              .join(" / ")
                          : "-"}
                      </td>
                      <td className="border-r border-b border-[#111] px-1 py-2 align-top leading-[1.2]">
                        {row.course_code}: {row.course_title}
                      </td>
                      <td className="border-r border-b border-[#111] px-1 py-2 text-center align-top leading-[1.2]">
                        {formatHours(row.lecture_hours)}
                      </td>
                      <td className="border-r border-b border-[#111] px-1 py-2 text-center align-top leading-[1.2]">
                        {row.lecture_room ?? (row.lecture_hours ? "ONLINE" : "-")}
                      </td>
                      <td className="border-r border-b border-[#111] px-1 py-2 text-center align-top leading-[1.2]">
                        {formatHours(row.laboratory_hours)}
                      </td>
                      <td className="border-r border-b border-[#111] px-1 py-2 text-center align-top leading-[1.2]">
                        {row.laboratory_room ?? (row.laboratory_hours ? "ONLINE" : "-")}
                      </td>
                      <td className="border-r border-b border-[#111] px-1 py-2 text-center align-top leading-[1.2]">
                        {row.block_codes_label || "-"}
                      </td>
                      <td className="border-b border-[#111] px-1 py-2 text-center align-top leading-[1.2]">
                        {row.student_count ?? "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </section>

        {/** Signatories */}
        <div className="pb-2">
          <section className="flex items-center gap-2 border-y border-[#111] px-1 py-1 text-[8px] font-bold">
            Conforme (Affix Faculty Signature):
          </section>
          <div className="mb-2 grid grid-cols-3 gap-3 text-[8px] italic px-1">
            <p>Prepared by:</p>
            <p>Recommending Approval:</p>
            <p>Approved:</p>
          </div>
          <div className="grid grid-cols-3 gap-3 px-1">
            <div className="text-center">
              <p className="min-h-4 border-[#111] text-[8px] font-bold tracking-[0.01em] uppercase">
                {formatSignedName(document.signatories.preparedBy.name)}
              </p>
              <p className="-mt-1 text-[8px]">
                {document.signatories.preparedBy.title}
              </p>
            </div>
            <div className="text-center">
              <p className="min-h-4 text-[8px] font-bold tracking-[0.01em] uppercase">
                {formatSignedName(
                  document.signatories.recommendingApproval.name,
                )}
              </p>
              <p className="-mt-1 text-[8px]">
                {document.signatories.recommendingApproval.title}
              </p>
            </div>
            <div className="text-center">
              <p className="min-h-4 border-[#111] text-[8px] font-bold tracking-[0.01em] uppercase">
                {formatSignedName(document.signatories.approvedBy.name)}
              </p>
              <p className="-mt-1 text-[8px]">
                {document.signatories.approvedBy.title}
              </p>
            </div>
          </div>
        </div>
      </div>
         <p className="mt-1 px-1 text-right text-[8px] text-[#333]">
            Generated at: {generatedAt}
          </p>
         
    </article>
  );
};

export default FacultyLoadPrintDocument;
