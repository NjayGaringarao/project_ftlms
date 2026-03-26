import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/utils";
import { getCurrentUserData } from "@/lib/user-data/queries";
import { getUserOverviewById } from "@/lib/user-overview";
import FacultyEvaluationWorkspace from "@/components/ftl-evaluation/faculty-load/faculty-evaluation-workspace";

type CampusFacultyEvaluationPageProps = {
  params: Promise<{ academic_term_id: string; faculty_id: string }>;
};

const CampusFacultyEvaluationPage = async ({
  params,
}: CampusFacultyEvaluationPageProps) => {
  const { academic_term_id, faculty_id } = await params;
  const [overview, roles, currentUserData] = await Promise.all([
    getUserOverviewById(faculty_id),
    getUserRole(),
    getCurrentUserData({ includeDesignations: true }),
  ]);

  if (!overview) {
    redirect(`/ftl-evaluation/${academic_term_id}/campus-load/faculty-load`);
  }

  const canManageAll = roles.includes("Admin");
  if (!canManageAll) {
    const allowedCampusIds = new Set(
      (currentUserData?.designations ?? [])
        .filter(
          (designation) =>
            designation.job_title === "Campus Director" &&
            designation.campus_id,
        )
        .map((designation) => designation.campus_id as string),
    );

    if (!overview.campus_id || !allowedCampusIds.has(overview.campus_id)) {
      redirect(`/ftl-evaluation/${academic_term_id}/campus-load/faculty-load`);
    }
  }

  return (
    <FacultyEvaluationWorkspace
      academicTermId={academic_term_id}
      facultyId={faculty_id}
      facultyName={overview.identity?.name ?? "Unknown Faculty"}
      facultyCampusId={overview.campus_id}
      campusName={overview.campus?.name ?? "No campus assigned"}
      collegeName={overview.college?.name ?? "No college assigned"}
    />
  );
};

export default CampusFacultyEvaluationPage;
