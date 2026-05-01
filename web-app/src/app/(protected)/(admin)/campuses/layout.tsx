import React from "react";
import { CampusesList } from "@/features/admin/components/campus/campuses-list";
import { getCampusesList } from "@/features/admin/lib/campuses";

const CampusesLayout = async ({ children }: { children: React.ReactNode }) => {
  const campuses = await getCampusesList();

  return (
    <div className="flex h-full overflow-hidden gap-4">
      <div className="flex-1 overflow-y-auto">
        <CampusesList campuses={campuses} />
      </div>

      {children}
    </div>
  );
};

export default CampusesLayout;
