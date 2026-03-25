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

  if (!selectedTerm) {
    if (terms.length > 0) {
      redirect(`/ftl-evaluation/${terms[0].id}`);
    }

    redirect("/ftl-evaluation");
  }

  const canAccessFacultyLoad =
    roles.includes("Campus Director") || roles.includes("Admin");
  const canAccessCampusLoad =
    roles.includes("Director for Instruction") ||
    roles.includes("Vice President for Academic Affairs") ||
    roles.includes("Admin");

  const navItems = [
    canAccessFacultyLoad
      ? {
          label: "Faculty Load",
          href: `/ftl-evaluation/${academic_term_id}/faculty-load`,
          activeMatch: "prefix" as const,
        }
      : null,
    canAccessCampusLoad
      ? {
          label: "Campus Load",
          href: `/ftl-evaluation/${academic_term_id}/campus-load`,
          activeMatch: "prefix" as const,
        }
      : null,
  ].filter(Boolean);

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      <TopBarNav title="FTL Evaluation" items={navItems}>
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
