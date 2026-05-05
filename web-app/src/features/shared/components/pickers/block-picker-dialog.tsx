"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Blocks, ChevronDown, Sliders, X } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import type { CourseLoadingBlockListItem } from "@/features/faculty-teaching-load/lib/course-loading/types";
import { Button } from "@/components/ui/button";
import CampusPickerDialog from "@/features/shared/components/pickers/campus-picker-dialog";
import ProgramOfferingPickerDialog from "@/features/shared/components/pickers/program-offering-picker-dialog";
import { cn } from "@/utils/style";

type BlockPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CourseLoadingBlockListItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  renderSubtitle?: (item: CourseLoadingBlockListItem) => string[];
  renderAnnotation?: (item: CourseLoadingBlockListItem) => ReactNode;
};

const toFixed = (value: number) => value.toFixed(2);

type BlockPickerDialogBodyProps = {
  items: CourseLoadingBlockListItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  searchPlaceholder: string;
  renderSubtitle?: (item: CourseLoadingBlockListItem) => string[];
  renderAnnotation?: (item: CourseLoadingBlockListItem) => ReactNode;
};

const BlockPickerDialogBody = ({
  items,
  selectedId,
  onSelect,
  searchPlaceholder,
  renderSubtitle,
  renderAnnotation,
}: BlockPickerDialogBodyProps) => {
  const [blockQuery, setBlockQuery] = useState("");
  const [blockYearFilter, setBlockYearFilter] = useState("");
  const [blockCampusFilter, setBlockCampusFilter] = useState("");
  const [blockProgramOfferingFilter, setBlockProgramOfferingFilter] =
    useState("");
  const [campusDialogOpen, setCampusDialogOpen] = useState(false);
  const [programOfferingDialogOpen, setProgramOfferingDialogOpen] =
    useState(false);
  const [campusQuery, setCampusQuery] = useState("");
  const [programOfferingQuery, setProgramOfferingQuery] = useState("");

  const blockYearOptions = useMemo(() => {
    const set = new Set<number>();
    items.forEach((item) => set.add(item.year_level));
    return Array.from(set).sort((a, b) => a - b);
  }, [items]);

  const blockCampusOptions = useMemo(() => {
    const map = new Map<string, { id: string; code: string; name: string }>();
    items.forEach((item) => {
      if (!item.campus_id) return;
      if (map.has(item.campus_id)) return;
      map.set(item.campus_id, {
        id: item.campus_id,
        code: item.campus_code ?? "",
        name: item.campus_name ?? "Unknown Campus",
      });
    });
    return Array.from(map.values());
  }, [items]);

  const blockProgramOfferingOptions = useMemo(() => {
    const map = new Map<string, (typeof items)[number]>();
    items.forEach((item) => {
      if (!item.program_offering_id) return;
      if (blockCampusFilter && item.campus_id !== blockCampusFilter) return;
      if (map.has(item.program_offering_id)) return;
      map.set(item.program_offering_id, item);
    });

    return Array.from(map.values()).map((item) => ({
      id: item.program_offering_id ?? "",
      campus_id: item.campus_id,
      campus_code: item.campus_code,
      campus_name: item.campus_name,
      program_code: item.program_code,
      program_name: item.program_name,
    }));
  }, [items, blockCampusFilter]);

  const filteredBlocks = useMemo(() => {
    const normalized = blockQuery.trim().toLowerCase();

    return items.filter((item) => {
      if (blockCampusFilter && item.campus_id !== blockCampusFilter) {
        return false;
      }

      if (
        blockProgramOfferingFilter &&
        item.program_offering_id !== blockProgramOfferingFilter
      ) {
        return false;
      }

      if (blockYearFilter && item.year_level !== Number(blockYearFilter)) {
        return false;
      }

      if (!normalized) return true;

      const searchable = [
        item.code,
        item.program_offering_code,
        item.program_code,
        item.program_name,
        item.campus_code,
        item.campus_name,
        `year ${item.year_level}`,
        `year level ${item.year_level}`,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalized);
    });
  }, [
    items,
    blockQuery,
    blockYearFilter,
    blockCampusFilter,
    blockProgramOfferingFilter,
  ]);

  const selectedCampus =
    blockCampusOptions.find((campus) => campus.id === blockCampusFilter) ??
    null;
  const selectedProgramOffering =
    blockProgramOfferingOptions.find(
      (offering) => offering.id === blockProgramOfferingFilter,
    ) ?? null;

  const renderFilterButton = (
    label: string,
    selectedLabel: string | null,
    onClick: () => void,
    onClear?: () => void,
  ) => (
    <div className="flex min-w-0 flex-1 items-center">
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "min-w-0 flex-1 justify-between font-normal",
          !selectedLabel && "text-foreground/70",
        )}
        onClick={onClick}
      >
        <span className="truncate">{selectedLabel ?? label}</span>
        <ChevronDown className="h-3 w-3 text-foreground/60" />
      </Button>
      {selectedLabel && onClear ? (
        <Button
          variant="ghost"
          size="sm"
          className="w-8 px-0"
          onClick={onClear}
          title={`Clear ${label}`}
        >
          <X className="h-3 w-3 text-foreground/60" />
        </Button>
      ) : null}
    </div>
  );

  return (
    <>
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <Input
          placeholder={searchPlaceholder}
          value={blockQuery}
          onChange={(event) => setBlockQuery(event.target.value)}
        />

        <div className="flex min-w-0 items-center gap-2">
          <Sliders className="h-4 min-w-4 text-foreground/60" />
          <div className="flex min-w-0 flex-1 gap-2">
            {renderFilterButton(
              "All Campus",
              selectedCampus ? selectedCampus.code || selectedCampus.name : null,
              () => {
                setCampusQuery("");
                setCampusDialogOpen(true);
              },
              blockCampusFilter
                ? () => {
                    setBlockCampusFilter("");
                    setBlockProgramOfferingFilter("");
                  }
                : undefined,
            )}
            {renderFilterButton(
              "All Program",
              selectedProgramOffering
                ? selectedProgramOffering.program_code ||
                    selectedProgramOffering.program_name ||
                    null
                : null,
              () => {
                setProgramOfferingQuery("");
                setProgramOfferingDialogOpen(true);
              },
              blockProgramOfferingFilter
                ? () => setBlockProgramOfferingFilter("")
                : undefined,
            )}
            <select
              value={blockYearFilter}
              onChange={(event) => setBlockYearFilter(event.target.value)}
              className="h-9 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm text-foreground/70"
            >
              <option value="">All Year</option>
              {blockYearOptions.map((year) => (
                <option key={year} value={year}>
                  Year {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
          {filteredBlocks.length === 0 && (
            <p className="p-4 text-center text-sm text-foreground/70 md:col-span-2">
              No blocks found.
            </p>
          )}

          {filteredBlocks.map((item) => (
            <ListItemSmall
              key={item.id}
              title={item.code}
              subtitle={
                renderSubtitle
                  ? renderSubtitle(item)
                  : [`${item.program_offering_code} | Year ${item.year_level}`]
              }
              isSelected={item.id === selectedId}
              onClick={() => onSelect(item.id)}
              icon={<Blocks className="h-5 w-5 text-background/80" />}
              listType="modal"
              annotations={
                renderAnnotation ? (
                  renderAnnotation(item)
                ) : (
                  <span className="rounded-md bg-foreground/10 px-1.5 py-1 text-xs">
                    Unit: {toFixed(item.total_unit)}
                  </span>
                )
              }
            />
          ))}
        </div>
      </div>

      <CampusPickerDialog
        open={campusDialogOpen}
        onOpenChange={setCampusDialogOpen}
        campuses={blockCampusOptions.map((campus) => ({
          id: campus.id,
          code: campus.code,
          name: campus.name,
          address: null,
        }))}
        selectedCampusId={blockCampusFilter}
        query={campusQuery}
        onQueryChange={setCampusQuery}
        onSelect={(nextCampusId) => {
          setBlockCampusFilter(nextCampusId);
          setBlockProgramOfferingFilter("");
          setCampusDialogOpen(false);
        }}
        emptyState="No campuses found."
      />

      <ProgramOfferingPickerDialog
        open={programOfferingDialogOpen}
        onOpenChange={setProgramOfferingDialogOpen}
        programOfferings={blockProgramOfferingOptions}
        selectedProgramOfferingId={blockProgramOfferingFilter}
        query={programOfferingQuery}
        onQueryChange={setProgramOfferingQuery}
        onSelect={(offeringId) => {
          setBlockProgramOfferingFilter(offeringId);
          setProgramOfferingDialogOpen(false);
        }}
        emptyState="No program offerings found."
      />
    </>
  );
};

const BlockPickerDialog = ({
  open,
  onOpenChange,
  items,
  selectedId,
  onSelect,
  title = "Select Block",
  description,
  searchPlaceholder = "Search blocks",
  renderSubtitle,
  renderAnnotation,
}: BlockPickerDialogProps) => {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      contentClassName="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden p-4"
      variant="floating-medium"
    >
      {open ? (
        <BlockPickerDialogBody
          items={items}
          selectedId={selectedId}
          onSelect={onSelect}
          searchPlaceholder={searchPlaceholder}
          renderSubtitle={renderSubtitle}
          renderAnnotation={renderAnnotation}
        />
      ) : null}
    </AppDialog>
  );
};

export default BlockPickerDialog;
