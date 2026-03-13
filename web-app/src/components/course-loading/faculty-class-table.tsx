"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, Trash2, Merge, Split, Check, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddTile } from "@/components/ui/add-tile";
import { AppDialog } from "@/components/ui/app-dialog";
import {
  deleteClass,
  mergeClasses,
  unmergeClass,
} from "@/lib/course-loading/actions";
import type { FacultyClassRow } from "@/lib/course-loading/types";
import { cn } from "@/utils/style";
import ClassMaker from "./class-maker";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type FacultyClassTableProps = {
  rows: FacultyClassRow[];
  academicTermId: string;
  facultyId: string;
};

const toFixed = (v: number) => v.toFixed(2);
const toBlockLabel = (block: FacultyClassRow["blocks"][number]) =>
  `${block.program_code} ${block.major_code} ${block.year_level}-${block.section}`;

export const FacultyClassTable = ({
  rows,
  academicTermId,
  facultyId,
}: FacultyClassTableProps) => {
  const [isPending, startTransition] = useTransition();
  const [classMakerOpen, setClassMakerOpen] = useState(false);
  const [editRow, setEditRow] = useState<FacultyClassRow | null>(null);
  const [mergeTarget, setMergeTarget] = useState<FacultyClassRow | null>(null);

  const mergeableByClassId = useMemo(() => {
    return new Map(
      rows.map((row) => [
        row.id,
        rows.filter(
          (candidate) =>
            candidate.id !== row.id &&
            candidate.course_id === row.course_id &&
            candidate.campus_code === row.campus_code,
        ),
      ]),
    );
  }, [rows]);

  const handleDelete = (classId: string) => {
    if (!confirm("Delete this class? This action cannot be undone.")) return;
    startTransition(async () => {
      await deleteClass(classId, academicTermId);
    });
  };

  const handleUnmerge = (classId: string) => {
    startTransition(async () => {
      await unmergeClass(classId, academicTermId);
    });
  };

  const totalAtl = rows.reduce((sum, r) => sum + r.atl, 0);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-lg">Teaching Designation</CardTitle>
        <div className="flex items-center gap-1">
          <p className="px-3 py-2 text-right">
            Actual Teaching Load: <b>{toFixed(totalAtl)}</b>{" "}
          </p>
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background border-b">
            <tr className="text-left text-xs text-foreground/60">
              <th className="px-3 py-2">Campus</th>
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Block(s)</th>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Laboratory</th>
              <th className="px-3 py-2">Lecture</th>
              <th className="px-3 py-2">ATL</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="py-4 text-left border-b hover:bg-foreground/5"
                onClick={() => {
                  setEditRow(row);
                  setClassMakerOpen(true);
                }}
              >
                <td className="px-3 py-2">{row.campus_name}</td>
                <td className="px-3 py-2">
                  <span className="font-medium">{row.course_code}</span>
                </td>
                <td className="px-3 py-2 text-foreground/70">
                  <div className="flex flex-col gap-1">
                    {row.blocks.map((block) => (
                      <span
                        key={block.class_block_id}
                        className="rounded bg-foreground/10 px-1.5 py-0.5 text-xs"
                      >
                        {toBlockLabel(block)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <span>{row.student_count}</span>
                    {row.student_count > 50 ? (
                      <span
                        className="inline-flex items-center text-red-600"
                        title="Class size is above 50"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-2">
                  {toFixed(row.laboratory_unit * 0.75)}
                </td>
                <td className="px-3 py-2">{toFixed(row.lecture_unit)}</td>
                <td className="px-3 py-2 font-medium">{toFixed(row.atl)}</td>

                <td className="w-20">
                  <div className="flex items-center justify-end gap-1">
                    {row.blocks.length > 1 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnmerge(row.id);
                        }}
                        title="Unmerge this class"
                      >
                        <Split className="h-4 w-4 text-foreground" />
                      </Button>
                    ) : null}

                    {(mergeableByClassId.get(row.id)?.length ?? 0) > 0 ? (
                      <Button
                        variant="outline"
                        title="Merge with a similar class"
                        size="sm"
                        disabled={isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMergeTarget(row);
                        }}
                      >
                        <Merge className="h-4 w-4 text-foreground" />
                      </Button>
                    ) : null}

                    <Button
                      title="Delete this class"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(row.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-foreground/60"
                >
                  No classes assigned yet.
                </td>
              </tr>
            )}
            <tr className="p-2 w-full">
              <td colSpan={8} className="py-1">
                <AddTile
                  title="Add Class"
                  containerClassName="justify-center items-center"
                  className="p-2"
                  onClick={() => {
                    setEditRow(null);
                    setClassMakerOpen(true);
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>

      {classMakerOpen && (
        <ClassMaker
          academicTermId={academicTermId}
          mode={editRow ? "Edit" : "Insert"}
          facultyId={facultyId}
          classId={editRow?.id}
          initialCampusId={editRow?.campus_id}
          initialCourseId={editRow?.course_id}
          initialBlockIds={editRow?.blocks.map((b) => b.block_id)}
          open={classMakerOpen}
          onOpenChange={setClassMakerOpen}
        />
      )}

      {mergeTarget && (
        <MergeClassDialog
          classRow={mergeTarget}
          candidates={mergeableByClassId.get(mergeTarget.id) ?? []}
          academicTermId={academicTermId}
          open={Boolean(mergeTarget)}
          onOpenChange={(open) => {
            if (!open) setMergeTarget(null);
          }}
        />
      )}
    </Card>
  );
};

// ─── Merge class dialog ──────────────────────────────────

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
            .map((block) => toBlockLabel(block).toLowerCase())
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
          placeholder="Search classes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="shrink-0 text-xs"
        />

        <div className="flex flex-1 flex-col gap-1 overflow-y-auto max-h-56">
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
                      .map((block) => toBlockLabel(block))
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
            {isPending ? "Merging…" : `Merge ${selected.size} Class(es)`}
          </Button>
        </div>
      </div>
    </AppDialog>
  );
};
