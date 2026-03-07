import React from "react";
import { redirect } from "next/navigation";
import { ProgramsList } from "@/components/admin/college/programs-list";
import { getProgramsByCollege } from "@/lib/admin/programs";
import { getCollegeById } from "@/lib/admin/colleges";

type CollegeProgramsLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

const CollegeProgramsLayout = async ({
  children,
  params,
}: CollegeProgramsLayoutProps) => {
  const { id } = await params;
  const college = await getCollegeById(id);

  if (!college) {
    redirect("/colleges");
  }

  const programs = await getProgramsByCollege(id);
  const basePath = `/colleges/${id}/programs`;

  return (
    <div className="flex h-full w-2/3 overflow-hidden gap-4">
      <div className="flex-1 overflow-y-auto">
        <ProgramsList
          programs={programs}
          basePath={basePath}
          createPath={`${basePath}/create`}
        />
      </div>
      {children}
    </div>
  );
};

export default CollegeProgramsLayout;
