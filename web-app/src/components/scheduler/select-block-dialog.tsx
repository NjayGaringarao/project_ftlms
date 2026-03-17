"use client";

import { useEffect, useMemo, useState } from "react";
import { Blocks } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import type { CourseLoadingBlockListItem } from "@/lib/course-loading/types";

type SelectBlockDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocks: CourseLoadingBlockListItem[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
};

const toFixed = (value: number) => value.toFixed(2);

const SelectBlockDialog = ({
  open,
  onOpenChange,
  blocks,
  selectedBlockId,
  onSelectBlock,
}: SelectBlockDialogProps) => {
  const [blockQuery, setBlockQuery] = useState("");
  const [blockCampusFilter, setBlockCampusFilter] = useState("");
  const [blockYearFilter, setBlockYearFilter] = useState("");

  const blockCampusOptions = useMemo(() => {
    const map = new Map<string, string>();
    blocks.forEach((item) => {
      if (item.campus_id && item.campus_name) {
        map.set(item.campus_id, item.campus_name);
      }
    });

    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [blocks]);

  const blockYearOptions = useMemo(() => {
    const set = new Set<number>();
    blocks.forEach((item) => set.add(item.year_level));
    return Array.from(set).sort((a, b) => a - b);
  }, [blocks]);

  const filteredBlocks = useMemo(() => {
    const normalized = blockQuery.trim().toLowerCase();

    return blocks.filter((item) => {
      if (blockCampusFilter && item.campus_id !== blockCampusFilter) {
        return false;
      }

      if (blockYearFilter && item.year_level !== Number(blockYearFilter)) {
        return false;
      }

      if (!normalized) return true;

      return (
        item.code.toLowerCase().includes(normalized) ||
        item.program_offering_code.toLowerCase().includes(normalized)
      );
    });
  }, [blocks, blockQuery, blockCampusFilter, blockYearFilter]);

  useEffect(() => {
    if (!open) return;
    setBlockQuery("");
    setBlockCampusFilter("");
    setBlockYearFilter("");
  }, [open]);

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
          onChange={(event) => setBlockQuery(event.target.value)}
        />

        <div className="flex gap-2">
          <select
            value={blockCampusFilter}
            onChange={(event) => setBlockCampusFilter(event.target.value)}
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
            onChange={(event) => setBlockYearFilter(event.target.value)}
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
          {filteredBlocks.length === 0 && (
            <p className="p-4 text-center text-sm text-foreground/70">
              No blocks found.
            </p>
          )}

          {filteredBlocks.map((item) => (
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
