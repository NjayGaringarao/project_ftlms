import { TopBarNav } from "@/components/ui/topbar-nav";
import { getTermById, getTermsList } from "@/lib/admin/terms";
import { redirect } from "next/navigation";
import SmallDisplayOverlay from "@/components/ui/small-display-overlay";
import React from "react";
import TermSwitcher from "@/components/shared/term-switcher";

type AcademicTermIdLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ academic_term_id: string }>;
};

const AcademicTermIdLayout = async ({
  children,
  params,
}: AcademicTermIdLayoutProps) => {
  const { academic_term_id } = await params;
  const [terms, selectedTerm] = await Promise.all([
    getTermsList(),
    getTermById(academic_term_id),
  ]);

  if (!selectedTerm) {
    if (terms.length > 0) {
      redirect(`/scheduler/${terms[0].id}`);
    }

    redirect("/scheduler");
  }

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      <TopBarNav
        title="Scheduler"
        items={[]}
      >
        <TermSwitcher
          terms={terms}
          selectedTermId={selectedTerm.id}
          routeConfig={{ mode: "segment", baseSegment: "scheduler" }}
          description="Search and switch the active scheduling term."
          refreshOnSelect
        />
      </TopBarNav>
      <div className="flex flex-col h-full overflow-hidden">{children}</div>
      <div className="absolute  h-full w-full bg-background z-100 lg:hidden flex flex-col items-center justify-center px-16">
        <SmallDisplayOverlay />
      </div>
    </div>
  );
};

export default AcademicTermIdLayout;
