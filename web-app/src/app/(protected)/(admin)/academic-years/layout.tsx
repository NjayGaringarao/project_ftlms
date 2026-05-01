import React from "react";
import { YearsList } from "@/features/admin/components/academic-year/years-list";
import { getAcademicYearsList } from "@/features/admin/lib/academic-years";

const AcademicYearsLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const years = await getAcademicYearsList();

  return (
    <div className="flex h-full overflow-hidden gap-4">
      <div className="flex-1 overflow-y-auto">
        <YearsList years={years} />
      </div>
      {children}
    </div>
  );
};

export default AcademicYearsLayout;
