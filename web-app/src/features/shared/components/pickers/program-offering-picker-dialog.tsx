"use client";

import { useEffect, useMemo } from "react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import { GraduationCap } from "lucide-react";

export type ProgramOfferingPickerItem = {
  id: string;
  campus_id: string;
  campus_code?: string | null;
  campus_name?: string | null;
  program_code?: string | null;
  program_name?: string | null;
};

type ProgramOfferingPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programOfferings: ProgramOfferingPickerItem[];
  selectedProgramOfferingId: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (offeringId: string) => void;
  emptyState?: string;
};

const ProgramOfferingPickerDialog = ({
  open,
  onOpenChange,
  programOfferings,
  selectedProgramOfferingId,
  query,
  onQueryChange,
  onSelect,
  emptyState = "No program offerings found.",
}: ProgramOfferingPickerDialogProps) => {
  const filteredOfferings = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return programOfferings;

    return programOfferings.filter((offering) => {
      const searchable = [
        offering.program_code ?? "",
        offering.program_name ?? "",
        offering.campus_code ?? "",
        offering.campus_name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalized);
    });
  }, [programOfferings, query]);

  useEffect(() => {
    if (!open) return;
    onQueryChange("");
  }, [open, onQueryChange]);

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Select Program Offering"
      description="Choose a program offering."
      contentClassName="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden"
    >
      <div className="flex h-full flex-col gap-1 overflow-hidden">
        <Input
          className="text-base"
          placeholder="Search program offering"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {filteredOfferings.length === 0 && (
            <p className="p-4 text-center text-sm text-foreground/70">
              {emptyState}
            </p>
          )}

          {filteredOfferings.map((offering) => (
            <ListItemSmall
              key={offering.id}
              title={offering.program_name ?? "Unknown Program"}
              subtitle={[
                `${offering.program_code ?? "Program"} - ${
                  offering.campus_name ?? "Unknown Campus"
                }`,
              ]}
              isSelected={offering.id === selectedProgramOfferingId}
              onClick={() => onSelect(offering.id)}
              icon={<GraduationCap className="h-5 w-5 text-background/80" />}
              listType="modal"
            />
          ))}
        </div>
      </div>
    </AppDialog>
  );
};

export default ProgramOfferingPickerDialog;
