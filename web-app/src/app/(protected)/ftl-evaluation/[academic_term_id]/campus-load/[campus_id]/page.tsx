import { redirect } from "next/navigation";
import { getCampusById } from "@/lib/admin/campuses";
import CampusEvaluationWorkspace from "@/components/ftl-evaluation/campus-load/campus-evaluation-workspace";

type CampusEvaluationPageProps = {
  params: Promise<{ academic_term_id: string; campus_id: string }>;
};

const CampusEvaluationPage = async ({ params }: CampusEvaluationPageProps) => {
  const { academic_term_id, campus_id } = await params;
  const campus = await getCampusById(campus_id);

  if (!campus) {
    redirect(`/ftl-evaluation/${academic_term_id}/campus-load`);
  }

  return (
    <CampusEvaluationWorkspace
      academicTermId={academic_term_id}
      campusId={campus_id}
      campusCode={campus.code}
      campusName={campus.name}
    />
  );
};

export default CampusEvaluationPage;
