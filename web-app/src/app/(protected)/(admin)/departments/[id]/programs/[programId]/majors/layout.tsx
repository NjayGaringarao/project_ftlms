import React from "react";
import { redirect } from "next/navigation";
import { MajorsList } from "@/components/admin/majors-list";
import { getMajorsByProgram } from "@/lib/admin/majors";
import { getProgramById } from "@/lib/admin/programs";

type ProgramMajorsLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string; programId: string }>;
};

const ProgramMajorsLayout = async ({
  children,
  params,
}: ProgramMajorsLayoutProps) => {
  const { id, programId } = await params;
  const program = await getProgramById(programId);

  if (!program || program.department_id !== id) {
    redirect(`/departments/${id}/programs`);
  }

  const majors = await getMajorsByProgram(programId);
  const basePath = `/departments/${id}/programs/${programId}/majors`;

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <MajorsList
          majors={majors}
          basePath={basePath}
          createPath={`${basePath}/create`}
        />
      </div>
      {children}
    </div>
  );
};

export default ProgramMajorsLayout;
