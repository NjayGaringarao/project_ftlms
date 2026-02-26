import React from "react";
import { MajorsCurriculumsList } from "@/components/admin/curriculum/majors-curriculums-list";
import { getMajorsList } from "@/lib/admin/majors";

const CurriculumsLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const majors = await getMajorsList();

  return (
    <div className="flex h-full overflow-hidden gap-4">
      <div className="flex-1 overflow-y-auto">
        <MajorsCurriculumsList majors={majors} />
      </div>
      {children}
    </div>
  );
};

export default CurriculumsLayout;
