import { PrmsuFormHeader } from "@/features/campus-college-load/components/print/prmsu-form-header";
import { formatNumber } from "@/features/campus-college-load/utils/format-number";
import { formatOrdinalYearLevel } from "@/features/campus-college-load/utils/ordinal";
import type {
  CampusCollegeLoadSnapshotClass,
  CampusCollegeLoadSnapshotMetadata,
  CampusCollegeLoadSnapshotSection,
} from "@/features/shared/types/models";

type SectionSummaryRow = {
  section: CampusCollegeLoadSnapshotSection;
  lecHours: number;
  labHours: number;
  totalHours: number;
};

const buildSectionSummary = (
  sections: CampusCollegeLoadSnapshotSection[],
  classes: CampusCollegeLoadSnapshotClass[],
): SectionSummaryRow[] => {
  return sections
    .slice()
    .sort((a, b) => {
      const yl = (a.year_level ?? 99) - (b.year_level ?? 99);
      if (yl !== 0) return yl;
      return a.section_code.localeCompare(b.section_code);
    })
    .map((section) => {
      const sectionClasses = classes.filter(
        (c) => c.section_id === section.section_id,
      );
      const lecHours = sectionClasses.reduce(
        (sum, c) => sum + (c.lecture_hours ?? 0),
        0,
      );
      const labHours = sectionClasses.reduce(
        (sum, c) => sum + (c.laboratory_hours ?? 0),
        0,
      );
      return { section, lecHours, labHours, totalHours: lecHours + labHours };
    });
};

export const ClassScheduleSummaryPage = ({
  metadata,
  sections,
  classes,
  programName,
  collegeLogoUrl,
}: {
  metadata: CampusCollegeLoadSnapshotMetadata;
  sections: CampusCollegeLoadSnapshotSection[];
  classes: CampusCollegeLoadSnapshotClass[];
  programName?: string | null;
  collegeLogoUrl?: string | null;
}) => {
  const semesterLabel = [
    metadata.academic_term_name,
    metadata.academic_year_code,
  ]
    .filter(Boolean)
    .join(", ");
  const rows = buildSectionSummary(sections, classes);

  return (
    <div className="bg-white p-6 text-black min-h-screen font-sans">
      <PrmsuFormHeader
        documentTitle="CLASS SCHEDULE"
        subtitle={semesterLabel}
        collegeName={metadata.college_name}
        campusName={metadata.campus_name}
        collegeLogoUrl={collegeLogoUrl}
      />

      {programName ? (
        <p className="text-center text-xs font-semibold mb-2">{programName}</p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="bg-neutral-100">
              <th className="border-2 border-gray-900 px-1.5 py-1 text-center w-8">
                NO
              </th>
              <th className="border-2 border-gray-900 px-1.5 py-1 text-left">
                SECTION
              </th>
              <th className="border-2 border-gray-900 px-1.5 py-1 text-center">
                YEAR LEVEL
              </th>
              <th className="border-2 border-gray-900 px-1.5 py-1 text-center">
                TOTAL LECTURE CLASS HOURS
              </th>
              <th className="border-2 border-gray-900 px-1.5 py-1 text-center">
                TOTAL LABORATORY CLASS HOURS
              </th>
              <th className="border-2 border-gray-900 px-1.5 py-1 text-center">
                TOTAL CLASS HOURS/WEEK
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.section.section_id}>
                <td className="border border-gray-900 px-1.5 py-1 text-center">
                  {i + 1}
                </td>
                <td className="border border-gray-900 px-1.5 py-1 font-medium">
                  {row.section.section_code}
                </td>
                <td className="border border-gray-900 px-1.5 py-1 text-center">
                  {formatOrdinalYearLevel(row.section.year_level)}
                </td>
                <td className="border border-gray-900 px-1.5 py-1 text-center">
                  {formatNumber(row.lecHours)}
                </td>
                <td className="border border-gray-900 px-1.5 py-1 text-center">
                  {formatNumber(row.labHours)}
                </td>
                <td className="border border-gray-900 px-1.5 py-1 text-center">
                  {formatNumber(row.totalHours)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <table className="w-full border-collapse mt-2">
        <tbody>
          <tr className="text-[9px] text-start">
            <td className="w-1/3">Prepared by:</td>
          </tr>
          <tr className="text-xs text-center">
            <td className="w-1/3">
              <p className="font-bold mt-4"></p>
              <p className="text-[10px]">Program Chairperson</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
