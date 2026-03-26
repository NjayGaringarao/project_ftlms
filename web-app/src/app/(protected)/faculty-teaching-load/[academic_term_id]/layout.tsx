import { TopBarNav } from "@/components/ui/topbar-nav";
import { FacultyList } from "@/components/faculty-teaching-load/faculty-list";
import TermSwitcher from "@/components/shared/term-switcher";
import { getTermById, getTermsList } from "@/lib/admin/terms";
import { getUserRole } from "@/lib/auth/utils";
import { getFacultyProposalListByTerm } from "@/lib/proposal/queries";
import { redirect } from "next/navigation";
import SmallDisplayOverlay from "@/components/ui/small-display-overlay";
import React from "react";

type AcademicTermIdLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ academic_term_id: string }>;
};

const AcademicTermIdLayout = async ({
  children,
  params,
}: AcademicTermIdLayoutProps) => {
  const { academic_term_id } = await params;
  const [roles, terms, selectedTerm] = await Promise.all([
    getUserRole(),
    getTermsList(),
    getTermById(academic_term_id),
  ]);

  const canAccess =
    roles.includes("Admin") ||
    roles.includes("Program Chairperson") ||
    roles.includes("College Dean");

  if (!canAccess) {
    redirect("/home");
  }

  if (!selectedTerm) {
    if (terms.length > 0) {
      redirect(`/faculty-teaching-load/${terms[0].id}`);
    }

    redirect("/faculty-teaching-load");
  }

  const faculty = await getFacultyProposalListByTerm(academic_term_id);

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      <TopBarNav title="Faculty Teaching Load" items={[]}>
        <TermSwitcher
          terms={terms}
          selectedTermId={selectedTerm.id}
          routeConfig={{ mode: "segment", baseSegment: "faculty-teaching-load" }}
          description="Search and switch the active faculty teaching load term."
          refreshOnSelect
        />
      </TopBarNav>
      <div className="flex h-full gap-4 overflow-hidden p-4">
        <div className="w-84 overflow-hidden">
          <FacultyList facultyList={faculty} academicTermId={academic_term_id} />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
      </div>
      <div className="absolute  h-full w-full bg-background z-100 lg:hidden flex flex-col items-center justify-center px-16">
        <SmallDisplayOverlay />
      </div>
    </div>
  );
};

export default AcademicTermIdLayout;


