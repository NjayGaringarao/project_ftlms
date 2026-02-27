import React from "react";
import { CurriculumsList } from "@/components/admin/curriculum/curriculums-list";
import { getCurriculumsList } from "@/lib/admin/curriculums";

const CurriculumsLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const curriculums = await getCurriculumsList();

  return (
    <div className="flex h-full overflow-hidden gap-4">
      <div className="flex-1 overflow-y-auto">
        <CurriculumsList
          curriculums={curriculums}
          basePath="/curriculums"
          createPath="/curriculums/create"
        />
      </div>
      {children}
    </div>
  );
};

export default CurriculumsLayout;
