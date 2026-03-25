import { redirect } from "next/navigation";
import { getUserOverviewById } from "@/lib/user-overview";
import FacultyEvaluationWorkspace from "@/components/ftl-evaluation/faculty-load/faculty-evaluation-workspace";

type FacultyEvaluationPageProps = {
  params: Promise<{ academic_term_id: string; faculty_id: string }>;
};

const FacultyEvaluationPage = async ({ params }: FacultyEvaluationPageProps) => {
  const { academic_term_id, faculty_id } = await params;
  const overview = await getUserOverviewById(faculty_id);

  if (!overview) {
    redirect(`/ftl-evaluation/${academic_term_id}/faculty-load`);
  }

  return (
    <FacultyEvaluationWorkspace
      academicTermId={academic_term_id}
      facultyId={faculty_id}
      facultyName={overview.identity?.name ?? "Unknown Faculty"}
      campusName={overview.campus?.name ?? "No campus assigned"}
      collegeName={overview.college?.name ?? "No college assigned"}
    />
  );
};

export default FacultyEvaluationPage;
