import React from "react";
import { redirect } from "next/navigation";
import { BlocksList } from "@/components/blocks/blocks-list";
import { getBlocksList } from "@/lib/admin/blocks";
import { getTermsList } from "@/lib/admin/terms";
import { getCampusesList } from "@/lib/admin/campuses";
import { getProgramOfferingsList } from "@/lib/admin/program-offerings";
import { TopBarNav } from "@/components/ui/topbar-nav";
import TermSwitcher from "@/components/shared/term-switcher";

type BlocksLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ academic_term_id: string }>;
};

const BlocksLayout = async ({ children, params }: BlocksLayoutProps) => {
  const { academic_term_id } = await params;
  const [blocks, terms, campuses, programOfferings] = await Promise.all([
    getBlocksList(),
    getTermsList(),
    getCampusesList(),
    getProgramOfferingsList(),
  ]);

  const selectedTerm = terms.find((term) => term.id === academic_term_id);
  if (!selectedTerm) {
    if (terms.length > 0) {
      redirect(`/blocks/${terms[0].id}`);
    }
    redirect("/blocks");
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBarNav title="Blocks" icon="blocks" items={[]}>
        <TermSwitcher
          terms={terms}
          selectedTermId={selectedTerm.id}
          routeConfig={{
            mode: "segment",
            baseSegment: "blocks",
            resetNestedOnSelect: true,
          }}
          description="Filter blocks by academic term."
          emptyLabel="No academic terms found."
          buttonClassName="bg-background/95 text-foreground justify-between"
          buttonSize="default"
          showSubtitle={false}
        />
      </TopBarNav>
      <div className="flex-1 flex flex-row p-4 gap-4 overflow-hidden">
        <div className="h-full w-92">
          <BlocksList
            blocks={blocks}
            campuses={campuses}
            programOfferings={programOfferings}
            academicTermId={academic_term_id}
          />
        </div>
        {children}
      </div>
    </div>
  );
};

export default BlocksLayout;
