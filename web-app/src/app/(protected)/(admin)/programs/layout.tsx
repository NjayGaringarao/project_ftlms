import React from "react";
import { ProgramsList } from "@/components/admin/programs-list";
import { getPrograms } from "@/lib/admin/programs";

const ProgramsLayout = async ({ children }: { children: React.ReactNode }) => {
  const programs = await getPrograms();

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <ProgramsList programs={programs} />
      </div>
      {children}
    </div>
  );
};

export default ProgramsLayout;
