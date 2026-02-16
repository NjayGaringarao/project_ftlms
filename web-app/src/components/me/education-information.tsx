"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  GraduationCap,
  Plus,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Degree } from "@/models/degree";
import { saveDegreesForCurrentUser } from "@/lib/me/profile";

type EducationInformationProps = {
  initialDegrees: Degree[];
};

type DegreeRow = {
  id?: string;
  tempId: string;
  academicLevel: string;
  degreeType: string;
  fieldOfStudy: string;
  institution: string;
  countryCode: string;
  yearGraduated: string;
};

const toDegreeRows = (degrees: Degree[]): DegreeRow[] =>
  degrees.map((degree) => ({
    id: degree.id,
    tempId: degree.id,
    academicLevel: degree.academic_level,
    degreeType: degree.degree_type,
    fieldOfStudy: degree.field_of_study,
    institution: degree.institution,
    countryCode: degree.country_code,
    yearGraduated: degree.year_graduated?.toString() ?? "",
  }));

const createEmptyRow = (): DegreeRow => ({
  tempId: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  academicLevel: "Master",
  degreeType: "Science",
  fieldOfStudy: "",
  institution: "",
  countryCode: "",
  yearGraduated: "",
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
      degree_type: row.degreeType.trim(),
      field_of_study: row.fieldOfStudy.trim(),
      institution: row.institution.trim(),
      country_code: row.countryCode.trim().toUpperCase(),
      year_graduated: row.yearGraduated.trim()
        ? Number(row.yearGraduated)
        : null,
    }));

    for (const [index, row] of rows.entries()) {
      if (!row.academicLevel.trim()) {
        setError(`Academic level is required (row ${index + 1})`);
        return;
      }
      if (!row.degreeType.trim()) {
        setError(`Degree type is required (row ${index + 1})`);
        return;
      }
      if (!row.fieldOfStudy.trim()) {
        setError(`Field of study is required (row ${index + 1})`);
        return;
      }
      if (!row.institution.trim()) {
        setError(`Institution is required (row ${index + 1})`);
        return;
      }
      if (!row.countryCode.trim()) {
        setError(`Country code is required (row ${index + 1})`);
        return;
      }
      if (row.yearGraduated.trim() && Number.isNaN(Number(row.yearGraduated))) {
        setError(`Year graduated must be a number (row ${index + 1})`);
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
          {showSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">
                  Education Updated
                </p>
                <p className="text-sm text-green-800">
                  Your degree list has been saved.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-900">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rows.length === 0 ? (
              <p className="text-sm text-foreground/60">
                No degrees added yet. Use the button below to add one.
              </p>
            ) : (
              rows.map((row, index) => (
                <div
                  key={row.tempId}
                  className="border border-border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-foreground/60">
                      Degree {index + 1}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(row.tempId)}
                      disabled={isSaving}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`degree-level-${row.tempId}`}>
                        Academic Level
                      </Label>
                      <Input
                        id={`degree-level-${row.tempId}`}
                        placeholder="e.g. Bachelor, Master"
                        value={row.academicLevel}
                        onChange={(event) =>
                          handleChange(
                            row.tempId,
                            "academicLevel",
                            event.target.value,
                          )
                        }
                        className="mt-1"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`degree-type-${row.tempId}`}>
                        Degree Type
                      </Label>
                      <Input
                        id={`degree-type-${row.tempId}`}
                        placeholder="e.g. Science, Arts"
                        value={row.degreeType}
                        onChange={(event) =>
                          handleChange(
                            row.tempId,
                            "degreeType",
                            event.target.value,
                          )
                        }
                        className="mt-1"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`degree-field-${row.tempId}`}>
                        Field of Study
                      </Label>
                      <Input
                        id={`degree-field-${row.tempId}`}
                        placeholder="e.g. Computer Science"
                        value={row.fieldOfStudy}
                        onChange={(event) =>
                          handleChange(
                            row.tempId,
                            "fieldOfStudy",
                            event.target.value,
                          )
                        }
                        className="mt-1"
                        disabled={isSaving}
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <Label htmlFor={`degree-institution-${row.tempId}`}>
                        Institution
                      </Label>
                      <Input
                        id={`degree-institution-${row.tempId}`}
                        placeholder="e.g. President Ramon Magsaysay State University"
                        value={row.institution}
                        onChange={(event) =>
                          handleChange(
                            row.tempId,
                            "institution",
                            event.target.value,
                          )
                        }
                        className="mt-1"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`degree-country-${row.tempId}`}>
                        Country Code
                      </Label>
                      <Input
                        id={`degree-country-${row.tempId}`}
                        placeholder="e.g. PH"
                        value={row.countryCode}
                        onChange={(event) =>
                          handleChange(
                            row.tempId,
                            "countryCode",
                            event.target.value.toUpperCase(),
                          )
                        }
                        className="mt-1"
                        maxLength={2}
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`degree-year-${row.tempId}`}>
                        Year Graduated (Optional)
                      </Label>
                      <Input
                        id={`degree-year-${row.tempId}`}
                        type="number"
                        min={1900}
                        max={new Date().getFullYear()}
                        placeholder="e.g. 2022"
                        value={row.yearGraduated}
                        onChange={(event) =>
                          handleChange(
                            row.tempId,
                            "yearGraduated",
                            event.target.value,
                          )
                        }
                        className="mt-1"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-between pt-2">
            <Button variant="outline" onClick={handleAdd} disabled={isSaving}>
              <Plus className="w-4 h-4 mr-1" />
              Add Degree
            </Button>
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EducationInformation;
