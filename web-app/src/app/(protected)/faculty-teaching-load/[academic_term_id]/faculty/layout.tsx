import React from "react";
import { FacultyList } from "@/components/faculty-teaching-load/faculty-list";
import { getFacultyListByTerm } from "@/lib/course-loading/queries";

type FacultyLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ academic_term_id: string }>;
};

const FacultyLayout = async ({ children, params }: FacultyLayoutProps) => {
  const { academic_term_id } = await params;
  const faculty = await getFacultyListByTerm(academic_term_id);

  return (
    <div className="flex h-full gap-4 overflow-hidden p-4">
      <div className="w-1/4 shrink-0 overflow-hidden rounded-lg border p-4">
        <FacultyList faculty={faculty} academicTermId={academic_term_id} />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export default FacultyLayout;
