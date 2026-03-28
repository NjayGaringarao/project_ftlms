import React from "react";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/utils";
import { getCurrentUserData } from "@/lib/user-data/queries";
import { getFacultyProposalListByTerm } from "@/lib/load-proposal/queries";
import FacultyEvaluationList from "@/components/ftl-evaluation/faculty-load/faculty-evaluation-list";

type CampusFacultyLoadLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ academic_term_id: string }>;
};

const CampusFacultyLoadLayout = async ({
  children,
  params,
}: CampusFacultyLoadLayoutProps) => {
  const { academic_term_id } = await params;
  const [roles, faculty, currentUserData] = await Promise.all([
    getUserRole(),
    getFacultyProposalListByTerm(academic_term_id),
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

  const allowedCampusIds = new Set(
    (currentUserData?.designations ?? [])
      .filter(
        (designation) =>
          designation.job_title === "Campus Director" && designation.campus_id,
      )
      .map((designation) => designation.campus_id as string),
  );

  const filteredFaculty = roles.includes("Admin")
    ? faculty
    : faculty.filter(
        (facultyRow) =>
          !!facultyRow.campus_id && allowedCampusIds.has(facultyRow.campus_id),
      );

  return (
    <div className="flex h-full gap-4 overflow-hidden p-4">
      <div className="w-84 overflow-hidden">
        <FacultyEvaluationList
          facultyList={filteredFaculty}
          academicTermId={academic_term_id}
        />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export default CampusFacultyLoadLayout;


