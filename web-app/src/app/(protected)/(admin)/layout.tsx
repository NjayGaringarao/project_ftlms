import { PageHeader } from "@/features/app-shell/components/page-header";
import React from "react";

const UniversityLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative flex h-full flex-col">
      <PageHeader accessLabel="Administrator Access" />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export default UniversityLayout;
