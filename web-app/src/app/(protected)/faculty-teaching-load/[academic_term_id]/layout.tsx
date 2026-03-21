import { TopBarNav } from "@/components/ui/topbar-nav";
import { CourseLoadingTermSwitcher } from "@/components/faculty-teaching-load/term-switcher";
import { getTermById, getTermsList } from "@/lib/admin/terms";
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
  const [terms, selectedTerm] = await Promise.all([
    getTermsList(),
    getTermById(academic_term_id),
  ]);

  if (!selectedTerm) {
    if (terms.length > 0) {
      redirect(`/faculty-teaching-load/${terms[0].id}`);
    }

    redirect("/faculty-teaching-load");
  }

  const basePath = `/faculty-teaching-load/${academic_term_id}`;

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      <TopBarNav
        title="Faculty Teaching Load"
        items={[
          { label: "Overview", href: basePath },
          {
            label: "Faculty",
            href: `${basePath}/faculty`,
            activeMatch: "prefix",
          },
        ]}
      >
        <CourseLoadingTermSwitcher
          terms={terms}
          selectedTermId={selectedTerm.id}
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
