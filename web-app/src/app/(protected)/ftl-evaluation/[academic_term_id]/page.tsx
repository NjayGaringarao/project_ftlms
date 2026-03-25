import { getUserRole } from "@/lib/auth/utils";
import { redirect } from "next/navigation";

type AcademicTermIdPageProps = {
  params: Promise<{ academic_term_id: string }>;
};

const FTLEvaluationAcademicTermPage = async ({
  params,
}: AcademicTermIdPageProps) => {
  const { academic_term_id } = await params;
  const roles = await getUserRole();

  if (roles.includes("Campus Director")) {
    redirect(`/ftl-evaluation/${academic_term_id}/faculty-load`);
  }

  if (
    roles.includes("Director for Instruction") ||
    roles.includes("Vice President for Academic Affairs")
  ) {
    redirect(`/ftl-evaluation/${academic_term_id}/campus-load`);
  }

  if (roles.includes("Admin")) {
    redirect(`/ftl-evaluation/${academic_term_id}/faculty-load`);
  }

  redirect("/home");
};

export default FTLEvaluationAcademicTermPage;
