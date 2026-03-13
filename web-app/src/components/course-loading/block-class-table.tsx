"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddTile } from "@/components/ui/add-tile";
import { deleteClass } from "@/lib/course-loading/actions";
import type { BlockClassRow } from "@/lib/course-loading/types";
import ClassMaker from "./class-maker";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

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
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-lg">Classes</CardTitle>
        <div className="flex items-center gap-1">
          <p className="px-3 py-2 text-right">
            Total Unit: <b>{totalUnit.toFixed(2)}</b>
          </p>
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b bg-background">
            <tr className="text-left text-xs text-foreground/60">
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Faculty</th>
              <th className="px-3 py-2">Laboratory (h)</th>
              <th className="px-3 py-2">Lecture (h)</th>
              <th className="px-3 py-2">Unit</th>
              <th className="px-3 py-2">Merge(s)</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer border-b py-4 text-left hover:bg-foreground/5"
                onClick={() => {
                  setEditClassId(row.id);
                  setClassMakerOpen(true);
                }}
              >
                <td className="px-3 py-2">
                  <span className="font-medium">{row.course_code}</span>
                </td>
                <td className="px-3 py-2 text-foreground/70">
                  {row.faculty_name}
                </td>
                <td className="px-3 py-2">{row.laboratory_hours}</td>
                <td className="px-3 py-2">{row.lecture_hours}</td>
                <td className="px-3 py-2 font-medium">{row.unit}</td>
                <td className="px-3 py-2 text-foreground/60 text-xs">
                  {row.merged_with.length > 0
                    ? row.merged_with.map((m) => m.block_code).join(", ")
                    : "—"}
                </td>
                <td className="w-20 px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <Button
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
                  colSpan={7}
                  className="px-3 py-8 text-center text-foreground/60"
                >
                  No classes assigned yet.
                </td>
              </tr>
            )}

            <tr>
              <td colSpan={7} className="py-1">
                <AddTile
                  title="Add Class"
                  containerClassName="items-center justify-center"
                  className="p-2"
                  onClick={() => {
                    setEditClassId(null);
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
    </Card>
  );
};
