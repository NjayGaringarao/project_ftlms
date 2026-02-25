import React from "react";
import { BlocksList } from "@/components/admin/blocks-list";
import { getBlocksList } from "@/lib/admin/blocks";

const BlocksLayout = async ({ children }: { children: React.ReactNode }) => {
  const blocks = await getBlocksList();

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <BlocksList blocks={blocks} />
      </div>
      {children}
    </div>
  );
};

export default BlocksLayout;
