import React from "react";
import { getFacultyListByTerm } from "@/lib/course-loading/queries";
import FacultyEvaluationList from "@/components/ftl-evaluation/faculty-load/faculty-evaluation-list";

type FacultyLoadLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ academic_term_id: string }>;
};

const FacultyLoadLayout = async ({ children, params }: FacultyLoadLayoutProps) => {
  const { academic_term_id } = await params;
  const faculty = await getFacultyListByTerm(academic_term_id);

  return (
    <div className="flex h-full gap-4 overflow-hidden p-4">
      <div className="w-84 overflow-hidden">
        <FacultyEvaluationList
          facultyList={faculty}
          academicTermId={academic_term_id}
        />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export default FacultyLoadLayout;
