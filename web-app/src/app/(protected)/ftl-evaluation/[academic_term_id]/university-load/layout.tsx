import React from "react";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/utils";
import { getCampusesList } from "@/lib/admin/campuses";
import { getTermsList } from "@/lib/admin/terms";
import { TopBarNav } from "@/components/ui/topbar-nav";
import TermSwitcher from "@/components/shared/term-switcher";
import UniversityEvaluationList from "@/components/ftl-evaluation/university-load/university-evaluation-list";

type UniversityLoadLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ academic_term_id: string }>;
};

const UniversityLoadLayout = async ({
  children,
  params,
}: UniversityLoadLayoutProps) => {
  const { academic_term_id } = await params;
  const [roles, campuses, terms] = await Promise.all([
    getUserRole(),
    getCampusesList(),
    getTermsList(),
  ]);

  const canAccess =
    roles.includes("Director for Instruction") ||
    roles.includes("Vice President for Academic Affairs") ||
    roles.includes("Admin");

  if (!canAccess) {
    if (roles.includes("Campus Director")) {
      redirect(`/ftl-evaluation/${academic_term_id}/campus-load/faculty-load`);
    }

    redirect("/home");
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <TopBarNav title="University Load" items={[]}>
        <TermSwitcher
          terms={terms}
          selectedTermId={academic_term_id}
          routeConfig={{ mode: "segment", baseSegment: "ftl-evaluation" }}
          description="Search and switch the active university-load evaluation term."
          refreshOnSelect
        />
      </TopBarNav>
      <div className="flex-1 min-h-0 flex gap-4 overflow-hidden p-4">
        <div className="w-84 overflow-hidden">
          <UniversityEvaluationList
            campuses={campuses}
            academicTermId={academic_term_id}
          />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
};

export default UniversityLoadLayout;
