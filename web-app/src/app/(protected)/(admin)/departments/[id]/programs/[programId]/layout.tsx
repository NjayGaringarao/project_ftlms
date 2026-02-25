import React from "react";
import { redirect } from "next/navigation";
import { ProgramView } from "@/components/admin/program-view";
import { getProgramById } from "@/lib/admin/programs";

type DepartmentProgramLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string; programId: string }>;
};

const DepartmentProgramLayout = async ({
  children,
  params,
}: DepartmentProgramLayoutProps) => {
  const { id, programId } = await params;
  const basePath = `/departments/${id}/programs`;
  const majorsPath = `${basePath}/${programId}/majors`;
  const program = await getProgramById(programId);

  if (!program || program.department_id !== id) {
    redirect(basePath);
  }

  return (
    <div className="flex h-full w-2/3 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <ProgramView
          program={program}
          basePath={basePath}
          majorsPath={majorsPath}
        />
      </div>

      {children}
    </div>
  );
};

export default DepartmentProgramLayout;
