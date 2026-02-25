import React from "react";
import { MajorsList } from "@/components/admin/majors-list";
import { getMajorsList } from "@/lib/admin/majors";

const MajorsLayout = async ({ children }: { children: React.ReactNode }) => {
  const majors = await getMajorsList();

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <MajorsList majors={majors} />
      </div>
      {children}
    </div>
  );
};

export default MajorsLayout;
