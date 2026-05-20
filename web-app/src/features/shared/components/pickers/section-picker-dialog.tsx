"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Blocks as Sections, ChevronDown, Sliders, X } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import type { CourseLoadingSectionListItem } from "@/features/course-loading/lib/types";
import { Button } from "@/components/ui/button";
import CampusPickerDialog from "@/features/shared/components/pickers/campus-picker-dialog";
import ProgramOfferingPickerDialog from "@/features/shared/components/pickers/program-offering-picker-dialog";
import { cn } from "@/utils/style";

type SectionPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CourseLoadingSectionListItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  renderSubtitle?: (item: CourseLoadingSectionListItem) => string[];
  renderAnnotation?: (item: CourseLoadingSectionListItem) => ReactNode;
};

const toFixed = (value: number) => value.toFixed(2);

type SectionPickerDialogBodyProps = {
  items: CourseLoadingSectionListItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  searchPlaceholder: string;
  renderSubtitle?: (item: CourseLoadingSectionListItem) => string[];
  renderAnnotation?: (item: CourseLoadingSectionListItem) => ReactNode;
};

const SectionPickerDialogBody = ({
  items,
  selectedId,
  onSelect,
  searchPlaceholder,
  renderSubtitle,
  renderAnnotation,
}: SectionPickerDialogBodyProps) => {
  const [sectionQuery, setSectionQuery] = useState("");
  const [sectionYearFilter, setSectionYearFilter] = useState("");
  const [sectionCampusFilter, setSectionCampusFilter] = useState("");
  const [sectionProgramOfferingFilter, setSectionProgramOfferingFilter] =
    useState("");
  const [campusDialogOpen, setCampusDialogOpen] = useState(false);
  const [programOfferingDialogOpen, setProgramOfferingDialogOpen] =
    useState(false);
  const [campusQuery, setCampusQuery] = useState("");
  const [programOfferingQuery, setProgramOfferingQuery] = useState("");

  const sectionYearOptions = useMemo(() => {
    const set = new Set<number>();
    items.forEach((item) => set.add(item.year_level));
    return Array.from(set).sort((a, b) => a - b);
  }, [items]);

  const sectionCampusOptions = useMemo(() => {
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

  const sectionProgramOfferingOptions = useMemo(() => {
    const map = new Map<string, (typeof items)[number]>();
    items.forEach((item) => {
      if (!item.program_offering_id) return;
      if (sectionCampusFilter && item.campus_id !== sectionCampusFilter) return;
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
  }, [items, sectionCampusFilter]);

  const filteredSections = useMemo(() => {
    const normalized = sectionQuery.trim().toLowerCase();

    return items.filter((item) => {
      if (sectionCampusFilter && item.campus_id !== sectionCampusFilter) {
        return false;
      }

      if (
        sectionProgramOfferingFilter &&
        item.program_offering_id !== sectionProgramOfferingFilter
      ) {
        return false;
      }

      if (sectionYearFilter && item.year_level !== Number(sectionYearFilter)) {
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
    sectionQuery,
    sectionYearFilter,
    sectionCampusFilter,
    sectionProgramOfferingFilter,
  ]);

  const selectedCampus =
    sectionCampusOptions.find((campus) => campus.id === sectionCampusFilter) ??
    null;
  const selectedProgramOffering =
    sectionProgramOfferingOptions.find(
      (offering) => offering.id === sectionProgramOfferingFilter,
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
          value={sectionQuery}
          onChange={(event) => setSectionQuery(event.target.value)}
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
              sectionCampusFilter
                ? () => {
                    setSectionCampusFilter("");
                    setSectionProgramOfferingFilter("");
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
              sectionProgramOfferingFilter
                ? () => setSectionProgramOfferingFilter("")
                : undefined,
            )}
            <select
              value={sectionYearFilter}
              onChange={(event) => setSectionYearFilter(event.target.value)}
              className="h-9 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm text-foreground/70"
            >
              <option value="">All Year</option>
              {sectionYearOptions.map((year) => (
                <option key={year} value={year}>
                  Year {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
          {filteredSections.length === 0 && (
            <p className="p-4 text-center text-sm text-foreground/70 md:col-span-2">
              No sections found.
            </p>
          )}

          {filteredSections.map((item) => (
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
              icon={<Sections className="h-5 w-5 text-background/80" />}
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
        campuses={sectionCampusOptions.map((campus) => ({
          id: campus.id,
          code: campus.code,
          name: campus.name,
          address: null,
        }))}
        selectedCampusId={sectionCampusFilter}
        query={campusQuery}
        onQueryChange={setCampusQuery}
        onSelect={(nextCampusId) => {
          setSectionCampusFilter(nextCampusId);
          setSectionProgramOfferingFilter("");
          setCampusDialogOpen(false);
        }}
        emptyState="No campuses found."
      />

      <ProgramOfferingPickerDialog
        open={programOfferingDialogOpen}
        onOpenChange={setProgramOfferingDialogOpen}
        programOfferings={sectionProgramOfferingOptions}
        selectedProgramOfferingId={sectionProgramOfferingFilter}
        query={programOfferingQuery}
        onQueryChange={setProgramOfferingQuery}
        onSelect={(offeringId) => {
          setSectionProgramOfferingFilter(offeringId);
          setProgramOfferingDialogOpen(false);
        }}
        emptyState="No program offerings found."
      />
    </>
  );
};

const SectionPickerDialog = ({
  open,
  onOpenChange,
  items,
  selectedId,
  onSelect,
  title = "Select Section",
  description,
  searchPlaceholder = "Search sections",
  renderSubtitle,
  renderAnnotation,
}: SectionPickerDialogProps) => {
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
        <SectionPickerDialogBody
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

export default SectionPickerDialog;
