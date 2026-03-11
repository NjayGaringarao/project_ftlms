import { TopBarNav } from "@/components/ui/topbar-nav";
import { CourseLoadingTermSwitcher } from "@/components/course-loading/term-switcher";
import { getTermById, getTermsList } from "@/lib/admin/terms";
import { redirect } from "next/navigation";
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
      redirect(`/course-loading/${terms[0].id}`);
    }

    redirect("/course-loading");
  }

  const basePath = `/course-loading/${academic_term_id}`;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <TopBarNav
        title="Course Loading"
        items={[
          { label: "Overview", href: basePath },
          {
            label: "Faculty-Aware",
            href: `${basePath}/faculty`,
            activeMatch: "prefix",
          },
          {
            label: "Block-Aware",
            href: `${basePath}/block`,
            activeMatch: "prefix",
          },
        ]}
      >
        <CourseLoadingTermSwitcher
          terms={terms}
          selectedTermId={selectedTerm.id}
        />
      </TopBarNav>
      <div className="relative flex flex-col h-full overflow-hidden">
      
 
        
        {children}</div>
    </div>
  );
};

export default AcademicTermIdLayout;