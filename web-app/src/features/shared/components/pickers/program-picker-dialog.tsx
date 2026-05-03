"use client";

import { useEffect, useMemo } from "react";
import { GraduationCap } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";

export type ProgramPickerItem = {
  id: string;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  college_code?: string | null;
  college_name?: string | null;
};

type ProgramPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programs: ProgramPickerItem[];
  selectedProgramId?: string;
  selectedProgramIds?: string[];
  selectionMode?: "single" | "multiple";
  query: string;
  onQueryChange: (value: string) => void;
  onSelect?: (programId: string) => void;
  onSelectionChange?: (programIds: string[]) => void;
  onConfirm?: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  clearLabel?: string;
  isConfirming?: boolean;
  error?: string;
  emptyState?: string;
};

const ProgramPickerDialog = ({
  open,
  onOpenChange,
  programs,
  selectedProgramId = "",
  selectedProgramIds = [],
  selectionMode = "single",
  query,
  onQueryChange,
  onSelect,
  onSelectionChange,
  onConfirm,
  title = "Select Program",
  description = "Choose a program.",
  confirmLabel = "Select Programs",
  clearLabel = "Clear",
  isConfirming = false,
  error,
  emptyState = "No programs found.",
}: ProgramPickerDialogProps) => {
  const isMultiple = selectionMode === "multiple";
  const selectedProgramIdSet = useMemo(
    () => new Set(selectedProgramIds),
    [selectedProgramIds],
  );

  const filteredPrograms = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return programs;

    return programs.filter((program) => {
      const searchable = [
        program.code ?? "",
        program.name ?? "",
        program.description ?? "",
        program.college_code ?? "",
        program.college_name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalized);
    });
  }, [programs, query]);

  useEffect(() => {
    if (!open) return;
    onQueryChange("");
  }, [open, onQueryChange]);

  const handleProgramClick = (programId: string) => {
    if (!isMultiple) {
      onSelect?.(programId);
      return;
    }

    const nextSelectedIds = selectedProgramIdSet.has(programId)
      ? selectedProgramIds.filter((id) => id !== programId)
      : [...selectedProgramIds, programId];

    onSelectionChange?.(nextSelectedIds);
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      contentClassName="flex max-h-[85vh] flex-col overflow-hidden"
      variant="floating-medium"
    >
      <div className="flex h-full flex-col gap-3 overflow-hidden p-4">
        <Input
          className="text-base"
          placeholder="Search program"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {filteredPrograms.length === 0 && (
            <p className="p-4 text-center text-sm text-foreground/70">
              {emptyState}
            </p>
          )}

          {filteredPrograms.map((program) => (
            <ListItemSmall
              key={program.id}
              title={program.name ?? "Unknown Program"}
              subtitle={[
                `${program.code ?? "Program"}${
                  program.college_name ? ` - ${program.college_name}` : ""
                }`,
              ]}
              isSelected={
                isMultiple
                  ? selectedProgramIdSet.has(program.id)
                  : program.id === selectedProgramId
              }
              onClick={() => handleProgramClick(program.id)}
              icon={<GraduationCap className="h-5 w-5 text-background/80" />}
              listType="modal"
            />
          ))}
        </div>

        {isMultiple ? (
          <div className="flex items-center justify-between gap-3 border-t pt-3">
            <p className="text-xs text-foreground/70">
              {selectedProgramIds.length} selected
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onSelectionChange?.([])}
                disabled={isConfirming || selectedProgramIds.length === 0}
              >
                {clearLabel}
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={isConfirming || selectedProgramIds.length === 0}
              >
                {isConfirming ? "Saving..." : confirmLabel}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </AppDialog>
  );
};

export default ProgramPickerDialog;
