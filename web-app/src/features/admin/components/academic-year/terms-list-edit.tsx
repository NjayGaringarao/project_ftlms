"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Calendar, CheckCircle } from "lucide-react";
import { AcademicYear } from "@/features/shared/types/models/academic_year";
import { AcademicTermName } from "@/features/shared/types/models";
import { TermListItem } from "@/features/admin/lib/terms";
import { createTerm, updateTerm, deleteTerm } from "@/features/admin/lib/actions";
import { Button } from "@/components/ui/button";
import { AddTile } from "@/components/ui/add-tile";
import TermEditItem, { TermRow } from "./term-edit-item";

type TermsListEditProps = {
  year: AcademicYear;
  terms: TermListItem[];
  onTermsChange: () => void;
};

const toTermRows = (terms: TermListItem[]): TermRow[] =>
  terms.map((term) => ({
    id: term.id,
    tempId: term.id,
    name: term.name,
    start: term.start.split("T")[0],
    end: term.end.split("T")[0],
  }));

const createEmptyRow = (yearStartYear: number, yearEndYear: number): TermRow => ({
  tempId: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name: "",
  start: new Date(yearStartYear, 0, 1).toISOString().split("T")[0],
  end: new Date(yearEndYear, 11, 31).toISOString().split("T")[0],
});

const normalizeRow = (row: TermRow) => ({
  id: row.id ?? null,
  name: row.name,
  start: row.start,
  end: row.end,
});

export const TermsListEdit = ({
  year,
  terms,
  onTermsChange,
}: TermsListEditProps) => {
  const initialRows = useMemo(() => toTermRows(terms), [terms]);
  const [rows, setRows] = useState<TermRow[]>(initialRows);
  const [savedRows, setSavedRows] = useState<TermRow[]>(initialRows);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const hasChanges = useMemo(() => {
    const current = rows.map(normalizeRow);
    const saved = savedRows.map(normalizeRow);
    return JSON.stringify(current) !== JSON.stringify(saved);
  }, [rows, savedRows]);

  const handleChange = (
    tempId: string,
    field: keyof TermRow,
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.tempId === tempId ? { ...row, [field]: value } : row,
      ),
    );
    setError("");
  };

  const handleAdd = () => {
    setRows((prev) => [...prev, createEmptyRow(year.start_year, year.end_year)]);
    setError("");
  };

  const handleRemove = (tempId: string) => {
    setRows((prev) => prev.filter((row) => row.tempId !== tempId));
    setError("");
  };

  const handleReset = () => {
    setRows(savedRows);
    setError("");
    setShowSuccess(false);
  };

  const handleSave = async () => {
    for (const [index, row] of rows.entries()) {
      if (!row.name.trim()) {
        setError(`Term name is required (term #${index + 1})`);
        return;
      }
      if (!row.start) {
        setError(`Start date is required (term #${index + 1})`);
        return;
      }
      if (!row.end) {
        setError(`End date is required (term #${index + 1})`);
        return;
      }
      if (new Date(row.start) > new Date(row.end)) {
        setError(`Start date must be before end date (term #${index + 1})`);
        return;
      }
    }

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    // Detect deletes: rows in saved but not in current
    const currentIds = new Set(rows.filter((r) => r.id).map((r) => r.id));
    const deletedRows = savedRows.filter((r) => r.id && !currentIds.has(r.id));

    // Detect creates: rows without an id
    const newRows = rows.filter((r) => !r.id);

    // Detect updates: rows with id that changed
    const updatedRows = rows.filter((r) => {
      if (!r.id) return false;
      const saved = savedRows.find((s) => s.id === r.id);
      if (!saved) return false;
      return (
        r.name !== saved.name || r.start !== saved.start || r.end !== saved.end
      );
    });

    // Execute deletes
    for (const row of deletedRows) {
      const result = await deleteTerm(row.id!);
      if (result.error) {
        setError(result.error);
        setIsSaving(false);
        return;
      }
    }

    // Execute updates
    for (const row of updatedRows) {
      const result = await updateTerm({
        id: row.id!,
        academic_year_id: year.id,
        name: row.name as AcademicTermName,
        start: row.start,
        end: row.end,
      });
      if (result.error) {
        setError(result.error);
        setIsSaving(false);
        return;
      }
    }

    // Execute creates
    for (const row of newRows) {
      const result = await createTerm({
        academic_year_id: year.id,
        name: row.name as AcademicTermName,
        start: row.start,
        end: row.end,
      });
      if (result.error) {
        setError(result.error);
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    setSavedRows(rows);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
    onTermsChange();
  };

  return (
    <section className="space-y-4 border-t pt-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        <h2 className="font-semibold">Academic Terms</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.length === 0 ? (
          <p className="text-sm text-foreground/60">
            No terms added yet. Use the button below to add one.
          </p>
        ) : (
          rows.map((row, index) => (
            <TermEditItem
              key={row.tempId}
              row={row}
              index={index}
              isSaving={isSaving}
              onRemove={handleRemove}
              onChange={handleChange}
            />
          ))
        )}

        <AddTile
          title="Add Term"
          onClick={handleAdd}
          disabled={isSaving}
          containerClassName="flex-col items-center justify-center"
        />
      </div>

      <div className="flex flex-wrap gap-2 justify-between items-center pt-2">
        <div className="flex flex-1">
          {showSuccess && (
            <div className="w-full px-4 py-2 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">
                Academic terms saved successfully.
              </p>
            </div>
          )}

          {error && (
            <div className="w-full px-4 py-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
              Reset
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
