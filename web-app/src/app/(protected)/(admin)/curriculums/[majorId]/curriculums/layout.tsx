import React from "react";
import { redirect } from "next/navigation";
import { CurriculumsList } from "@/components/admin/curriculum/curriculums-list";
import { getCurriculumsByMajor } from "@/lib/admin/curriculums";
import { getMajorById } from "@/lib/admin/majors";

type MajorCurriculumsLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ majorId: string }>;
};

const MajorCurriculumsLayout = async ({
  children,
  params,
}: MajorCurriculumsLayoutProps) => {
  const { majorId } = await params;
  const major = await getMajorById(majorId);

  if (!major) {
    redirect("/curriculums");
  }

  const curriculums = await getCurriculumsByMajor(majorId);
  const basePath = `/curriculums/${majorId}/curriculums`;

  return (
    <div className="flex h-full w-2/3 overflow-hidden gap-4">
      <div className="flex-1 overflow-y-auto">
        <CurriculumsList
          curriculums={curriculums}
          basePath={basePath}
          createPath={`${basePath}/create`}
        />
      </div>
      {children}
    </div>
  );
};

export default MajorCurriculumsLayout;
