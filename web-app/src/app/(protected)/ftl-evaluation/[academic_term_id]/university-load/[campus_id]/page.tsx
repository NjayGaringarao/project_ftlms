import { redirect } from "next/navigation";
import { getCampusById } from "@/features/admin/lib/campuses";
import UniversityEvaluationWorkspace from "@/features/ftl-evaluation/components/university-load/university-evaluation-workspace";

type UniversityEvaluationPageProps = {
  params: Promise<{ academic_term_id: string; campus_id: string }>;
};

const UniversityEvaluationPage = async ({
  params,
}: UniversityEvaluationPageProps) => {
  const { academic_term_id, campus_id } = await params;
  const campus = await getCampusById(campus_id);

  if (!campus) {
    redirect(`/ftl-evaluation/${academic_term_id}/university-load`);
  }

  return (
    <UniversityEvaluationWorkspace
      academicTermId={academic_term_id}
      campusId={campus_id}
      campusCode={campus.code}
      campusName={campus.name}
    />
  );
};

export default UniversityEvaluationPage;
