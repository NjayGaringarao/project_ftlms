import React from "react";
import { redirect } from "next/navigation";
import { TopBarNav } from "@/components/ui/topbar-nav";
import TermSwitcher from "@/components/shared/term-switcher";
import { getUserRole } from "@/lib/auth/utils";
import { getTermsList } from "@/lib/admin/terms";

type CampusLoadLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ academic_term_id: string }>;
};

const CampusLoadLayout = async ({ children, params }: CampusLoadLayoutProps) => {
  const { academic_term_id } = await params;
  const [roles, terms] = await Promise.all([getUserRole(), getTermsList()]);

  const canAccess =
    roles.includes("Campus Director") || roles.includes("Admin");

  if (!canAccess) {
    if (
      roles.includes("Director for Instruction") ||
      roles.includes("Vice President for Academic Affairs")
    ) {
      redirect(`/ftl-evaluation/${academic_term_id}/university-load`);
    }

    redirect("/home");
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <TopBarNav
        title="Campus Load"
        items={[
          {
            label: "Faculty Load",
            href: `/ftl-evaluation/${academic_term_id}/campus-load/faculty-load`,
            activeMatch: "prefix",
          },
          {
            label: "Campus Proposal Control",
            href: `/ftl-evaluation/${academic_term_id}/campus-load/campus-proposal-control`,
            activeMatch: "prefix",
          },
        ]}
      >
        <TermSwitcher
          terms={terms}
          selectedTermId={academic_term_id}
          routeConfig={{ mode: "segment", baseSegment: "ftl-evaluation" }}
          description="Search and switch the active campus-load evaluation term."
          refreshOnSelect
        />
      </TopBarNav>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
};

export default CampusLoadLayout;
