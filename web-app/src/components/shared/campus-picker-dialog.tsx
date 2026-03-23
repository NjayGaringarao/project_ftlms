"use client";

import { useEffect, useMemo } from "react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import { Landmark } from "lucide-react";
import type { CampusListItem } from "@/lib/admin/campuses";

type CampusPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campuses: CampusListItem[];
  selectedCampusId: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (campusId: string) => void;
  emptyState?: string;
};

const CampusPickerDialog = ({
  open,
  onOpenChange,
  campuses,
  selectedCampusId,
  query,
  onQueryChange,
  onSelect,
  emptyState = "No campuses found.",
}: CampusPickerDialogProps) => {
  const filteredCampuses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return campuses;

    return campuses.filter((campus) => {
      const searchable = [campus.code, campus.name].join(" ").toLowerCase();
      return searchable.includes(normalized);
    });
  }, [campuses, query]);

  useEffect(() => {
    if (!open) return;
    onQueryChange("");
  }, [open, onQueryChange]);

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Select Campus"
      description="Choose a campus."
      contentClassName="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden"
    >
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <Input
          placeholder="Search campus"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />

        <div className="flex-1 grid grid-cols-2 gap-1 overflow-y-auto">
          {filteredCampuses.length === 0 && (
            <p className="p-4 text-center text-sm text-foreground/70">
              {emptyState}
            </p>
          )}

          {filteredCampuses.map((campus) => (
            <ListItemSmall
              key={campus.id}
              title={campus.name}
              subtitle={[campus.address]}
              isSelected={campus.id === selectedCampusId}
              onClick={() => onSelect(campus.id)}
              icon={<Landmark className="h-full w-8 text-background/80" />}
              annotations={
                <span className="text-xs text-foreground py-1 px-2 bg-foreground/10 rounded-xl">
                  {campus.code}
                </span>
              }
              listType="modal"
            />
          ))}
        </div>
      </div>
    </AppDialog>
  );
};

export default CampusPickerDialog;
