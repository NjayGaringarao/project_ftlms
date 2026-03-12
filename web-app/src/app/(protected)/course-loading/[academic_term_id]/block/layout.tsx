import React from "react";
import { BlockList } from "@/components/course-loading/block-list";
import { getBlockListByTerm } from "@/lib/course-loading/queries";

type BlockLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ academic_term_id: string }>;
};

const BlockLayout = async ({ children, params }: BlockLayoutProps) => {
  const { academic_term_id } = await params;
  const blocks = await getBlockListByTerm(academic_term_id);

  return (
    <div className="flex h-full gap-4 overflow-hidden p-4">
      <div className="w-1/4 shrink-0 overflow-hidden rounded-lg border p-4">
        <BlockList blocks={blocks} academicTermId={academic_term_id} />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export default BlockLayout;
