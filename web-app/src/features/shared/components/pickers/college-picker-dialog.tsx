"use client";

import { useEffect, useMemo } from "react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import { GraduationCap } from "lucide-react";
import type { CollegeListItem } from "@/features/admin/lib/colleges";

type CollegePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colleges: CollegeListItem[];
  selectedCollegeId: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (collegeId: string) => void;
  emptyState?: string;
};

const CollegePickerDialog = ({
  open,
  onOpenChange,
  colleges,
  selectedCollegeId,
  query,
  onQueryChange,
  onSelect,
  emptyState = "No colleges found.",
}: CollegePickerDialogProps) => {
  const filteredColleges = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return colleges;

    return colleges.filter((college) => {
      const searchable = [college.code, college.name].join(" ").toLowerCase();
      return searchable.includes(normalized);
    });
  }, [colleges, query]);

  useEffect(() => {
    if (!open) return;
    onQueryChange("");
  }, [open, onQueryChange]);

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Select College"
      description="Choose a college."
      contentClassName="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden"
    >
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <Input
          placeholder="Search college"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />

        <div className="flex-1 grid grid-cols-2 gap-2 overflow-y-auto">
          {filteredColleges.length === 0 && (
            <p className="p-4 text-center text-sm text-foreground/70">
              {emptyState}
            </p>
          )}

          {filteredColleges.map((college) => (
            <ListItemSmall
              key={college.id}
              title={college.name}
              subtitle={[college.description ?? ""]}
              isSelected={college.id === selectedCollegeId}
              onClick={() => onSelect(college.id)}
              icon={<GraduationCap className="h-full w-8 text-background/80" />}
              annotations={
                <span className="text-xs text-foreground py-1 px-2 bg-foreground/10 rounded-xl">
                  {college.code}
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

export default CollegePickerDialog;
