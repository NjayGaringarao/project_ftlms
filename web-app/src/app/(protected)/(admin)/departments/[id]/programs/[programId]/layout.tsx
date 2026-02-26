import React from "react";
import { redirect } from "next/navigation";
import { ProgramView } from "@/components/admin/program-view";
import { getProgramById } from "@/lib/admin/programs";

type DepartmentProgramsLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string; programId: string }>;
};

const ProgramsLayout = async ({
  children,
  params,
}: DepartmentProgramsLayoutProps) => {
  const { id, programId } = await params;
  const basePath = `/departments/${id}/programs`;
  const program = await getProgramById(programId);

  if (!program || program.department_id !== id) {
    redirect(basePath);
  }

  return (
    <div className="flex h-full overflow-hidden gap-4">
      <div className="flex-1 overflow-y-auto">
        <ProgramView program={program} basePath={basePath} />
      </div>

      {children}
    </div>
  );
};

export default ProgramsLayout;
