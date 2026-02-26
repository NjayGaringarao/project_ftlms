import React from "react";
import { redirect } from "next/navigation";
import { ProgramView } from "@/components/admin/program-view";
import { getProgramById } from "@/lib/admin/programs";

type DepartmentProgramsLayoutProps = {
  children: React.ReactNode;
};

const ProgramsLayout = async ({ children }: DepartmentProgramsLayoutProps) => {
  return (
    <div className="flex h-full overflow-hidden gap-4 w-1/2">{children}</div>
  );
};

export default ProgramsLayout;
