import React from "react";
import { SemestersList } from "@/components/university/semesters-list";
import { getSemestersList } from "@/lib/university/semesters";

const SemestersLayout = async ({ children }: { children: React.ReactNode }) => {
  const semesters = await getSemestersList();

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <SemestersList semesters={semesters} />
      </div>

      {children}
    </div>
  );
};

export default SemestersLayout;
