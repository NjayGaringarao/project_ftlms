import { getUserRole } from "@/features/auth/lib/utils";
import { redirect } from "next/navigation";

type CampusLoadPageProps = {
  params: Promise<{ academic_term_id: string }>;
};

const CampusLoadPage = async ({ params }: CampusLoadPageProps) => {
  const { academic_term_id } = await params;
  const roles = await getUserRole();

  const canAccessCampusDirectorFlow =
    roles.includes("Campus Director") || roles.includes("Admin");
  const canAccessUniversityFlow =
    roles.includes("Director for Instruction") ||
    roles.includes("Vice President for Academic Affairs") ||
    roles.includes("Admin");

  if (canAccessCampusDirectorFlow) {
    redirect(`/ftl-evaluation/${academic_term_id}/campus-load/faculty-load`);
  }

  if (canAccessUniversityFlow) {
    redirect(`/ftl-evaluation/${academic_term_id}/university-load`);
  }

  redirect("/home");
};

export default CampusLoadPage;
