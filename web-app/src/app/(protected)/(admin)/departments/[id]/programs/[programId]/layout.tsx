import React from "react";

type DepartmentProgramsLayoutProps = {
  children: React.ReactNode;
};

const ProgramsLayout = async ({ children }: DepartmentProgramsLayoutProps) => {
  return <div className="flex-1 overflow-hidden gap-4">{children}</div>;
};

export default ProgramsLayout;
