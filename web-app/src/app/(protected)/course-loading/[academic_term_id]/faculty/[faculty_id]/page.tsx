import { FacultyClassTable } from "@/components/course-loading/faculty-class-table";
import FacultyOverviewPanel from "@/components/course-loading/faculty-overview-panel";
import { getClassesByFacultyAndTerm } from "@/lib/course-loading/queries";
import { getUserOverviewById } from "@/lib/user-overview";
import { redirect } from "next/navigation";

type FacultyIdPageProps = {
  params: Promise<{ academic_term_id: string; faculty_id: string }>;
};

const FacultyIdPage = async ({ params }: FacultyIdPageProps) => {
  const { academic_term_id, faculty_id } = await params;

  const [classRows, overview] = await Promise.all([
    getClassesByFacultyAndTerm(faculty_id, academic_term_id),
    getUserOverviewById(faculty_id),
  ]);

  if (!overview) redirect(`/course-loading/${academic_term_id}/faculty`);

  const termAtl = classRows.reduce((sum, r) => sum + r.atl, 0);

  return (
    <div className="flex h-full rounded-lg gap-4">
      <div className="h-full flex-1 overflow-hidden">
        <FacultyClassTable
          rows={classRows}
          academicTermId={academic_term_id}
          facultyId={faculty_id}
        />
      </div>

      <div className="h-full w-1/3 overflow-hidden border rounded-md">
        <FacultyOverviewPanel
          overview={overview}
          termActualTeachingLoad={termAtl}
        />
      </div>
    </div>
  );
};

export default FacultyIdPage;
