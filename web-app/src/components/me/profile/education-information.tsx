"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle, GraduationCap, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Degree } from "@/models/degree";
import { saveDegreesForCurrentUser } from "@/lib/me/profile";
import DegreeItem, { DegreeRow } from "./degree-item";
import { AddTile } from "@/components/ui/add-tile";

type EducationInformationProps = {
  initialDegrees: Degree[];
};

const toDegreeRows = (degrees: Degree[]): DegreeRow[] =>
  degrees.map((degree) => ({
    id: degree.id,
    tempId: degree.id,
    academicLevel: degree.academic_level,
    title: degree.title,
    institution: degree.institution,
    countryCode: degree.country_code,
    yearGraduated: degree.year_graduated?.toString() ?? "",
  }));

const createEmptyRow = (): DegreeRow => ({
  tempId: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  academicLevel: "Master's Degree",
  title: "",
  institution: "",
  countryCode: "",
  yearGraduated: "",
});

const normalizeRowForComparison = (row: DegreeRow) => ({
  id: row.id ?? null,
  academicLevel: row.academicLevel,
  title: row.title,
  institution: row.institution,
  countryCode: row.countryCode,
  yearGraduated: row.yearGraduated,
});

const EducationInformation = ({
  initialDegrees,
}: EducationInformationProps) => {
  const initialRows = useMemo(
    () => toDegreeRows(initialDegrees),
    [initialDegrees],
  );
  const [rows, setRows] = useState<DegreeRow[]>(initialRows);
  const [savedRows, setSavedRows] = useState<DegreeRow[]>(initialRows);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const hasChanges = useMemo(() => {
    const currentRows = rows.map(normalizeRowForComparison);
    const lastSavedRows = savedRows.map(normalizeRowForComparison);

    return JSON.stringify(currentRows) !== JSON.stringify(lastSavedRows);
  }, [rows, savedRows]);

  const handleChange = (
    tempId: string,
    field: keyof DegreeRow,
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
    setRows((prev) => [...prev, createEmptyRow()]);
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
    const normalized = rows.map((row) => ({
      id: row.id,
      academic_level: row.academicLevel.trim(),
      title: row.title.trim(),
      institution: row.institution.trim(),
      country_code: row.countryCode.trim().toUpperCase(),
      year_graduated: row.yearGraduated.trim()
        ? Number(row.yearGraduated)
        : null,
    }));

    for (const [index, row] of rows.entries()) {
      if (!row.academicLevel.trim()) {
        setError(`Academic level is required (degree #${index + 1})`);
        return;
      }
      if (!row.title.trim()) {
        setError(`Degree title is required (degree #${index + 1})`);
        return;
      }
      if (!row.institution.trim()) {
        setError(`Institution is required (degree #${index + 1})`);
        return;
      }
      if (!row.countryCode.trim()) {
        setError(`Country code is required (degree #${index + 1})`);
        return;
      }
      if (row.yearGraduated.trim() && Number.isNaN(Number(row.yearGraduated))) {
        setError(`Year graduated must be a number (degree #${index + 1})`);
        return;
      }
    }

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    const { data, error: saveError } =
      await saveDegreesForCurrentUser(normalized);

    setIsSaving(false);

    if (saveError) {
      setError(saveError);
      return;
    }

    const updatedRows = toDegreeRows(data ?? []);
    setSavedRows(updatedRows);
    setRows(updatedRows);
    setShowSuccess(true);

    setTimeout(() => setShowSuccess(false), 8000);
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          Education
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {rows.length === 0 ? (
              <p className="text-sm text-foreground/60">
                No degrees added yet. Use the button below to add one.
              </p>
            ) : (
              rows.map((row, index) => (
                <DegreeItem
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
              title="Add Degree"
              onClick={handleAdd}
              className="h-86"
              titleClassName="text-lg"
              containerClassName="flex-col items-center justify-center"
              iconClassName="h-10 w-10"
              disabled={isSaving}
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-between items-center pt-2">
            <div className="flex flex-1">
              {showSuccess && (
                <div className="w-full px-4 py-2 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />

                  <p className="text-sm text-green-800">
                    Your degree list has been saved.
                  </p>
                </div>
              )}

              {error && (
                <div className="w-full px-4 py-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-red-900">{error}</p>
                </div>
              )}
            </div>

            {hasChanges && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSaving}
                >
                  Reset
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EducationInformation;
