"use client";

import { useMemo, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mergeClasses } from "@/lib/course-loading/actions";
import { formatFacultyBlockLabel } from "@/lib/course-loading/formatters";
import type { FacultyClassRow } from "@/lib/course-loading/types";
import { cn } from "@/utils/style";

type MergeClassDialogProps = {
  classRow: FacultyClassRow;
  candidates: FacultyClassRow[];
  academicTermId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const MergeClassDialog = ({
  classRow,
  candidates,
  academicTermId,
  open,
  onOpenChange,
}: MergeClassDialogProps) => {
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const available = useMemo(() => {
    let result = candidates;
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (candidate) =>
          candidate.class_code.toLowerCase().includes(q) ||
          candidate.course_code.toLowerCase().includes(q) ||
          candidate.blocks
            .map((block) => formatFacultyBlockLabel(block).toLowerCase())
            .join(" ")
            .includes(q),
      );
    }
    return result;
  }, [candidates, query]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMerge = () => {
    setError("");
    startTransition(async () => {
      const result = await mergeClasses(
        classRow.id,
        Array.from(selected),
        academicTermId,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
    });
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Merge Classes"
      description={`Merge ${classRow.class_code} with classes that share the same campus and course.`}
      contentClassName="flex max-h-[70vh] w-full max-w-md flex-col overflow-hidden"
    >
      <div className="flex flex-col gap-3 overflow-hidden">
        <Input
          placeholder="Search classes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="shrink-0 text-xs"
        />

        <div className="flex max-h-56 flex-1 flex-col gap-1 overflow-y-auto">
          {available.length === 0 && (
            <p className="py-3 text-center text-xs text-foreground/60">
              No classes available to merge.
            </p>
          )}
          {available.map((candidate) => {
            const isSelected = selected.has(candidate.id);
            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => toggle(candidate.id)}
                className={cn(
                  "flex items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition",
                  "hover:bg-foreground/5",
                  isSelected && "bg-foreground/10 font-semibold",
                )}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    isSelected
                      ? "border-foreground bg-foreground text-background"
                      : "border-foreground/30",
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate">{candidate.class_code}</p>
                  <p className="truncate text-foreground/60">
                    {candidate.blocks
                      .map((block) => formatFacultyBlockLabel(block))
                      .join(", ")}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleMerge}
            disabled={selected.size === 0 || isPending}
          >
            {isPending ? "Merging..." : `Merge ${selected.size} Class(es)`}
          </Button>
        </div>
      </div>
    </AppDialog>
  );
};

export default MergeClassDialog;
