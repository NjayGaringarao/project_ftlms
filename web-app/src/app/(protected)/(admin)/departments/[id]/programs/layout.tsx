import React from "react";
import { redirect } from "next/navigation";
import { ProgramsList } from "@/components/admin/programs-list";
import { getProgramsByDepartment } from "@/lib/admin/programs";
import { getDepartmentById } from "@/lib/admin/departments";

type DepartmentProgramsLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

const DepartmentProgramsLayout = async ({
  children,
  params,
}: DepartmentProgramsLayoutProps) => {
  const { id } = await params;
  const department = await getDepartmentById(id);

  if (!department) {
    redirect("/departments");
  }

  const programs = await getProgramsByDepartment(id);
  const basePath = `/departments/${id}/programs`;

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

export default DepartmentProgramsLayout;
