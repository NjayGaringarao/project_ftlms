import React from "react";
import { redirect } from "next/navigation";
import { ProgramView } from "@/components/admin/college/program-view";
import { getProgramById } from "@/lib/admin/programs";

type DepartmentProgramsLayoutProps = {
  params: Promise<{ id: string; programId: string }>;
};

const ProgramsPage = async ({ params }: DepartmentProgramsLayoutProps) => {
  const { id, programId } = await params;
  const basePath = `/colleges/${id}/programs`;
  const program = await getProgramById(programId);

  if (!program || program.college_id !== id) {
    redirect(basePath);
  }

  return (
    <div className="flex h-full overflow-hidden gap-4 w-full">
      <div className="flex-1 overflow-y-auto">
        <ProgramView program={program} basePath={basePath} />
      </div>
    </div>
  );
};

export default ProgramsPage;
