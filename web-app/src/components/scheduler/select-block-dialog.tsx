"use client";

import { Blocks } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import type { CourseLoadingBlockListItem } from "@/lib/course-loading/types";

type SelectBlockDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockQuery: string;
  onBlockQueryChange: (value: string) => void;
  blockCampusFilter: string;
  onBlockCampusFilterChange: (value: string) => void;
  blockCampusOptions: Array<{ id: string; name: string }>;
  blockYearFilter: string;
  onBlockYearFilterChange: (value: string) => void;
  blockYearOptions: number[];
  blocks: CourseLoadingBlockListItem[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
};

const toFixed = (value: number) => value.toFixed(2);

const SelectBlockDialog = ({
  open,
  onOpenChange,
  blockQuery,
  onBlockQueryChange,
  blockCampusFilter,
  onBlockCampusFilterChange,
  blockCampusOptions,
  blockYearFilter,
  onBlockYearFilterChange,
  blockYearOptions,
  blocks,
  selectedBlockId,
  onSelectBlock,
}: SelectBlockDialogProps) => {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Select Block"
      description="Select one context at a time. Choosing a block clears faculty and room context."
      contentClassName="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden"
    >
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <Input
          placeholder="Search blocks"
          value={blockQuery}
          onChange={(event) => onBlockQueryChange(event.target.value)}
        />

        <div className="flex gap-2">
          <select
            value={blockCampusFilter}
            onChange={(event) => onBlockCampusFilterChange(event.target.value)}
            className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">All Campuses</option>
            {blockCampusOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={blockYearFilter}
            onChange={(event) => onBlockYearFilterChange(event.target.value)}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">All Years</option>
            {blockYearOptions.map((year) => (
              <option key={year} value={year}>
                Year {year}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {blocks.length === 0 && (
            <p className="p-4 text-center text-sm text-foreground/70">
              No blocks found.
            </p>
          )}

          {blocks.map((item) => (
            <ListItemSmall
              key={item.id}
              title={item.code}
              subtitle={[`${item.program_offering_code} | Year ${item.year_level}`]}
              isSelected={item.id === selectedBlockId}
              onClick={() => onSelectBlock(item.id)}
              icon={<Blocks className="h-5 w-5 text-background/80" />}
              annotations={
                <span className="rounded-md bg-foreground/10 px-1.5 py-1 text-xs">
                  Unit: {toFixed(item.total_unit)}
                </span>
              }
            />
          ))}
        </div>
      </div>
    </AppDialog>
  );
};

export default SelectBlockDialog;
