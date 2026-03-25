import React from "react";
import { getCampusesList } from "@/lib/admin/campuses";
import CampusEvaluationList from "@/components/ftl-evaluation/campus-load/campus-evaluation-list";

type CampusLoadLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ academic_term_id: string }>;
};

const CampusLoadLayout = async ({ children, params }: CampusLoadLayoutProps) => {
  const { academic_term_id } = await params;
  const campuses = await getCampusesList();

  return (
    <div className="flex h-full gap-4 overflow-hidden p-4">
      <div className="w-84 overflow-hidden">
        <CampusEvaluationList
          campuses={campuses}
          academicTermId={academic_term_id}
        />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export default CampusLoadLayout;
