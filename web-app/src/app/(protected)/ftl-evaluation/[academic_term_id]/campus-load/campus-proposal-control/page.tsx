import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/utils";
import { getCurrentUserData } from "@/lib/user-data/queries";
import { getCampusById, getCampusesList } from "@/lib/admin/campuses";
import CampusLoadControlWorkspace from "@/components/ftl-evaluation/campus-load/campus-load-control-workspace";

type CampusLoadControlPageProps = {
  params: Promise<{ academic_term_id: string }>;
};

const CampusLoadControlPage = async ({
  params,
}: CampusLoadControlPageProps) => {
  const { academic_term_id } = await params;

  const [roles, currentUserData] = await Promise.all([
    getUserRole(),
    getCurrentUserData({ includeDesignations: true }),
  ]);

  const canAccess = roles.includes("Campus Director") || roles.includes("Admin");
  if (!canAccess) {
    if (
      roles.includes("Director for Instruction") ||
      roles.includes("Vice President for Academic Affairs")
    ) {
      redirect(`/ftl-evaluation/${academic_term_id}/university-load`);
    }
    redirect("/home");
  }

  const campusDirectorDesignations = (currentUserData?.designations ?? []).filter(
    (designation) =>
      designation.job_title === "Campus Director" && designation.campus_id,
  );

  let campusId = campusDirectorDesignations[0]?.campus_id ?? null;
  if (!campusId && roles.includes("Admin")) {
    const campuses = await getCampusesList();
    campusId = campuses[0]?.id ?? null;
  }

  if (!campusId) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="max-w-lg rounded-lg border border-dashed p-6 text-sm text-foreground/70">
          No campus is available for campus load control. Assign a Campus
          Director designation first or create campus records.
        </div>
      </div>
    );
  }

  const campus = await getCampusById(campusId);
  if (!campus) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="max-w-lg rounded-lg border border-dashed p-6 text-sm text-foreground/70">
          Unable to resolve campus information for campus load control.
        </div>
      </div>
    );
  }

  return (
    <CampusLoadControlWorkspace
      academicTermId={academic_term_id}
      campusId={campus.id}
      campusCode={campus.code}
      campusName={campus.name}
    />
  );
};

export default CampusLoadControlPage;
