import React from "react";
import { CampusesList } from "@/components/university/campuses-list";
import { getCampusesList } from "@/lib/university/campuses";

const CampusesLayout = async ({ children }: { children: React.ReactNode }) => {
  const campuses = await getCampusesList();

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <CampusesList campuses={campuses} />
      </div>

      {children}
    </div>
  );
};

export default CampusesLayout;
