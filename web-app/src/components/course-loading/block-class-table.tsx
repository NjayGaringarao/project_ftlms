"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddTile } from "@/components/ui/add-tile";
import { deleteClass } from "@/lib/course-loading/actions";
import type { BlockClassRow } from "@/lib/course-loading/types";
import ClassMaker from "./class-maker";

type BlockClassTableProps = {
  rows: BlockClassRow[];
  academicTermId: string;
  blockId: string;
};

export const BlockClassTable = ({
  rows,
  academicTermId,
  blockId,
}: BlockClassTableProps) => {
  const [isPending, startTransition] = useTransition();
  const [classMakerOpen, setClassMakerOpen] = useState(false);
  const [editClassId, setEditClassId] = useState<string | null>(null);

  const handleDelete = (classId: string) => {
    if (!confirm("Delete this class? This action cannot be undone.")) return;
    startTransition(async () => {
      await deleteClass(classId, academicTermId);
    });
  };

  const totalUnit = rows.reduce((sum, r) => sum + r.unit, 0);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background border-b">
            <tr className="text-left text-xs text-foreground/60">
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Faculty</th>
              <th className="px-3 py-2 text-right">Lab (h)</th>
              <th className="px-3 py-2 text-right">Lec (h)</th>
              <th className="px-3 py-2 text-right">Unit</th>
              <th className="px-3 py-2">Merge</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-foreground/5">
                <td className="px-3 py-2">
                  <span className="font-medium">{row.course_code}</span>
                </td>
                <td className="px-3 py-2 text-foreground/70">
                  {row.faculty_name}
                </td>
                <td className="px-3 py-2 text-right">{row.laboratory_hours}</td>
                <td className="px-3 py-2 text-right">{row.lecture_hours}</td>
                <td className="px-3 py-2 text-right font-medium">{row.unit}</td>
                <td className="px-3 py-2 text-foreground/60 text-xs">
                  {row.merged_with.length > 0
                    ? row.merged_with.map((m) => m.block_code).join(", ")
                    : "—"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => {
                        setEditClassId(row.id);
                        setClassMakerOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleDelete(row.id)}
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
                  colSpan={7}
                  className="px-3 py-8 text-center text-foreground/60"
                >
                  No classes assigned yet.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="border-t bg-foreground/5">
            <tr>
              <td colSpan={4} className="px-3 py-2 text-right font-semibold">
                Total Unit
              </td>
              <td className="px-3 py-2 text-right font-bold">{totalUnit}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>

        <div className="p-3">
          <AddTile
            title="Add Class"
            description="Assign a new course to this block"
            onClick={() => {
              setEditClassId(null);
              setClassMakerOpen(true);
            }}
          />
        </div>
      </div>

      {classMakerOpen && (
        <ClassMaker
          academicTermId={academicTermId}
          mode={editClassId ? "Edit" : "Insert"}
          blockId={blockId}
          classId={editClassId ?? undefined}
          initialCourseId={
            editClassId
              ? rows.find((row) => row.id === editClassId)?.course_id
              : undefined
          }
          initialFacultyId={
            editClassId
              ? rows.find((row) => row.id === editClassId)?.faculty_id
              : undefined
          }
          initialBlockIds={
            editClassId
              ? (() => {
                  const row = rows.find((item) => item.id === editClassId);
                  if (!row) return undefined;
                  return [blockId, ...row.merged_with.map((m) => m.block_id)];
                })()
              : undefined
          }
          open={classMakerOpen}
          onOpenChange={setClassMakerOpen}
        />
      )}
    </div>
  );
};
