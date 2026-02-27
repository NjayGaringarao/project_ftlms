"use client";

import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getDepartmentsList,
  type DepartmentListItem,
} from "@/lib/admin/departments";
import { getPrograms } from "@/lib/admin/programs";
import { getMajorsList, type MajorListItem } from "@/lib/admin/majors";

export type CurriculumFormState = {
  major_id: string;
  title: string;
  series_year: string;
  revised_year: string;
};

type CurriculumInitialFormProps = {
  formData: CurriculumFormState;
  onChange: (field: keyof CurriculumFormState, value: string) => void;
  onReset: () => void;
  onSubmit: () => void;
  isSaving?: boolean;
  submitLabel: string;
  submitLoadingLabel: string;
};

export const CurriculumInitialForm = ({
  formData,
  onChange,
  onReset,
  onSubmit,
  isSaving = false,
  submitLabel,
  submitLoadingLabel,
}: CurriculumInitialFormProps) => {
  const [departmentOptions, setDepartmentOptions] = useState<
    DepartmentListItem[]
  >([]);
  const [programOptions, setProgramOptions] = useState<
    Array<{ id: string; code: string; name: string; department_id: string }>
  >([]);
  const [majorOptions, setMajorOptions] = useState<MajorListItem[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  useEffect(() => {
    const loadOptions = async () => {
      setIsLoadingOptions(true);
      const [departments, programs, majors] = await Promise.all([
        getDepartmentsList(),
        getPrograms(),
        getMajorsList(),
      ]);

      setDepartmentOptions(departments.filter((d) => d.type === "ACADEMIC"));
      setProgramOptions(
        programs.map((program) => ({
          id: program.id,
          code: program.code,
          name: program.name,
          department_id: program.department_id,
        })),
      );
      setMajorOptions(majors);
      setIsLoadingOptions(false);
    };

    loadOptions();
  }, []);

  useEffect(() => {
    if (!formData.major_id || majorOptions.length === 0 || isLoadingOptions) {
      return;
    }

    const selectedMajor = majorOptions.find(
      (major) => major.id === formData.major_id,
    );
    if (!selectedMajor) return;

    const nextProgramId = selectedMajor.program_id;
    const nextDepartmentId = selectedMajor.program?.department_id ?? "";

    if (nextDepartmentId && nextDepartmentId !== selectedDepartmentId) {
      setSelectedDepartmentId(nextDepartmentId);
    }

    if (nextProgramId && nextProgramId !== selectedProgramId) {
      setSelectedProgramId(nextProgramId);
    }
  }, [
    formData.major_id,
    isLoadingOptions,
    majorOptions,
    selectedDepartmentId,
    selectedProgramId,
  ]);

  const filteredProgramOptions = useMemo(() => {
    if (!selectedDepartmentId) return [];
    return programOptions.filter(
      (program) => program.department_id === selectedDepartmentId,
    );
  }, [programOptions, selectedDepartmentId]);

  const filteredMajorOptions = useMemo(() => {
    if (!selectedProgramId) return [];
    return majorOptions.filter(
      (major) => major.program_id === selectedProgramId,
    );
  }, [majorOptions, selectedProgramId]);

  const disabled = isSaving || isLoadingOptions;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs" htmlFor="curriculum-department-id">
            Department (Academic) *
          </Label>
          <select
            id="curriculum-department-id"
            className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
            value={selectedDepartmentId}
            onChange={(event) => {
              const nextDepartmentId = event.target.value;
              setSelectedDepartmentId(nextDepartmentId);
              setSelectedProgramId("");
              onChange("major_id", "");
            }}
            disabled={disabled}
          >
            <option value="">Select department...</option>
            {departmentOptions.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name} ({department.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-xs" htmlFor="curriculum-program-id">
            Program *
          </Label>
          <select
            id="curriculum-program-id"
            className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
            value={selectedProgramId}
            onChange={(event) => {
              const nextProgramId = event.target.value;
              setSelectedProgramId(nextProgramId);
              onChange("major_id", "");
            }}
            disabled={disabled || !selectedDepartmentId}
          >
            <option value="">Select program...</option>
            {filteredProgramOptions.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name} ({program.code})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <Label className="text-xs" htmlFor="curriculum-major-id">
            Major *
          </Label>
          <select
            id="curriculum-major-id"
            className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
            value={formData.major_id}
            onChange={(event) => onChange("major_id", event.target.value)}
            disabled={disabled || !selectedProgramId}
          >
            <option value="">Select major...</option>
            {filteredMajorOptions.map((major) => (
              <option key={major.id} value={major.id}>
                {major.program?.code ? `${major.program.code} - ` : ""}
                {major.name} ({major.code})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <Label className="text-xs" htmlFor="curriculum-title">
            Title *
          </Label>
          <Input
            id="curriculum-title"
            value={formData.title}
            onChange={(event) => onChange("title", event.target.value)}
            onBlur={(event) => onChange("title", event.target.value.trim())}
            className="mt-1"
            disabled={disabled}
          />
        </div>

        <div>
          <Label className="text-xs" htmlFor="curriculum-series-year">
            Series Year *
          </Label>
          <Input
            id="curriculum-series-year"
            type="number"
            min="1900"
            value={formData.series_year}
            onChange={(event) => onChange("series_year", event.target.value)}
            className="mt-1"
            disabled={disabled}
          />
        </div>

        <div>
          <Label className="text-xs" htmlFor="curriculum-revised-year">
            Revised Year
          </Label>
          <Input
            id="curriculum-revised-year"
            type="number"
            min="1900"
            value={formData.revised_year}
            onChange={(event) => onChange("revised_year", event.target.value)}
            className="mt-1"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button variant="outline" onClick={onReset} disabled={disabled}>
          Reset
        </Button>
        <Button onClick={onSubmit} disabled={disabled}>
          {disabled ? submitLoadingLabel : submitLabel}
        </Button>
      </div>
    </div>
  );
};
