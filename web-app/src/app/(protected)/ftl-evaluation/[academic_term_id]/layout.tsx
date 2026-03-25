import React from "react";
import { redirect } from "next/navigation";
import { TopBarNav } from "@/components/ui/topbar-nav";
import SmallDisplayOverlay from "@/components/ui/small-display-overlay";
import TermSwitcher from "@/components/shared/term-switcher";
import { getTermById, getTermsList } from "@/lib/admin/terms";
import { getUserRole } from "@/lib/auth/utils";

type AcademicTermIdLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ academic_term_id: string }>;
};

const FTLEvaluationAcademicTermLayout = async ({
  children,
  params,
}: AcademicTermIdLayoutProps) => {
  const { academic_term_id } = await params;
  const [terms, selectedTerm, roles] = await Promise.all([
    getTermsList(),
    getTermById(academic_term_id),
    getUserRole(),
  ]);

  if (
    !roles.includes("Campus Director") &&
    !roles.includes("Director for Instruction") &&
    !roles.includes("Vice President for Academic Affairs")
  ) {
    redirect("/home");
  }

  if (!selectedTerm) {
    if (terms.length > 0) {
      redirect(`/ftl-evaluation/${terms[0].id}`);
    }

    redirect("/ftl-evaluation");
  }

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      <TopBarNav title="FTL Evaluation" items={[]}>
        <TermSwitcher
          terms={terms}
          selectedTermId={selectedTerm.id}
          routeConfig={{ mode: "segment", baseSegment: "ftl-evaluation" }}
          description="Search and switch the active FTL evaluation term."
          refreshOnSelect
        />
      </TopBarNav>
      <div className="flex flex-col h-full overflow-hidden">{children}</div>
      <div className="absolute h-full w-full bg-background z-100 lg:hidden flex flex-col items-center justify-center px-16">
        <SmallDisplayOverlay />
      </div>
    </div>
  );
};

export default FTLEvaluationAcademicTermLayout;
