import React from "react";
import { BlocksList } from "@/components/blocks/blocks-list";
import { getBlocksList } from "@/lib/admin/blocks";
import { getTermsList } from "@/lib/admin/terms";
import { getCampusesList } from "@/lib/admin/campuses";
import { getProgramOfferingsList } from "@/lib/admin/program-offerings";
import { TopBarNav } from "@/components/ui/topbar-nav";
import BlocksTermPicker from "@/components/blocks/blocks-term-picker";

const BlocksLayout = async ({ children }: { children: React.ReactNode }) => {
  const [blocks, terms, campuses, programOfferings] = await Promise.all([
    getBlocksList(),
    getTermsList(),
    getCampusesList(),
    getProgramOfferingsList(),
  ]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBarNav title="Blocks" icon="blocks" items={[]}>
        <BlocksTermPicker terms={terms} />
      </TopBarNav>
      <div className="flex-1 flex flex-row p-4 gap-4 overflow-hidden">
        <div className="h-full w-92">
          <BlocksList
            blocks={blocks}
            campuses={campuses}
            programOfferings={programOfferings}
          />
        </div>
        {children}
      </div>
    </div>
  );
};

export default BlocksLayout;
