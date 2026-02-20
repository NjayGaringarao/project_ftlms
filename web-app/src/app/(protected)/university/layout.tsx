import { TopBarNav } from "@/components/ui/topbar-nav";
import React from "react";

const UniversityLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-full flex-col">
      <TopBarNav
        title="University"
        items={[
          { label: "Overview", href: "/university" },
          { label: "Departments", href: "/university/departments" },
          { label: "Campuses", href: "/university/campuses" },
          { label: "Semesters", href: "/university/semesters" },
          { label: "Academic Ranks", href: "/university/ranks" },
        ]}
        icon="landmark"
      />
      {children}
    </div>
  );
};

export default UniversityLayout;
