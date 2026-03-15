import React from "react";
import MapperLeftPane from "@/components/scheduler/mapper-left-pane";
import { getBlockListByTerm } from "@/lib/course-loading/queries";

type MapperLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ academic_term_id: string }>;
};

const MapperLayout = async ({ children, params }: MapperLayoutProps) => {
  const { academic_term_id } = await params;
  const blocks = await getBlockListByTerm(academic_term_id);

  return (
    <div className="flex w-full h-full gap-4 overflow-hidden p-4">
      <div className="flex w-1/4">
        <MapperLeftPane academicTermId={academic_term_id} blocks={blocks} />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export default MapperLayout;
