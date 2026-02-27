"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CirclePlus } from "lucide-react";
import { createCurriculum } from "@/lib/admin/actions";
import { getMajorsList, MajorListItem } from "@/lib/admin/majors";
import {
  getDepartmentsList,
  DepartmentListItem,
} from "@/lib/admin/departments";
import { getPrograms } from "@/lib/admin/programs";
import AdminPanel from "../admin-panel";
import FormStatusBanner from "../form-status-banner";
import { Label } from "@/components/ui/label";
import {
  CurriculumInitialForm,
  type CurriculumFormState,
} from "./curriculum-initial-form";

const initialFormState: CurriculumFormState = {
  major_id: "",
  title: "",
  series_year: "",
  revised_year: "",
};

type CurriculumCreateProps = {
  basePath?: string;
};

export const CurriculumCreate = ({
  basePath = "/curriculums",
}: CurriculumCreateProps) => {
  const router = useRouter();
  const [formData, setFormData] =
    useState<CurriculumFormState>(initialFormState);
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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

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

  const filteredProgramOptions = useMemo(() => {
    if (!selectedDepartmentId) return [];
    return programOptions.filter(
      (program) => program.department_id === selectedDepartmentId,
    );
  }, [selectedDepartmentId, programOptions]);

  const filteredMajorOptions = useMemo(() => {
    if (!selectedProgramId) return [];
    return majorOptions.filter(
      (major) => major.program_id === selectedProgramId,
    );
  }, [selectedProgramId, majorOptions]);

  const handleChange = (field: keyof CurriculumFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setSelectedDepartmentId("");
    setSelectedProgramId("");
    setError("");
    setShowSuccess(false);
  };

  const handleCreate = async () => {
    const parsedSeriesYear = Number(formData.series_year);
    const parsedRevisedYear = formData.revised_year.trim()
      ? Number(formData.revised_year)
      : null;

    if (!formData.major_id.trim()) {
      setError("Major is required");
      return;
    }
    if (!formData.title.trim()) {
      setError("Curriculum title is required");
      return;
    }
    if (!Number.isInteger(parsedSeriesYear)) {
      setError("Series year is required");
      return;
    }
    if (
      parsedRevisedYear !== null &&
      (!Number.isInteger(parsedRevisedYear) ||
        parsedRevisedYear < parsedSeriesYear)
    ) {
      setError("Revised year must be greater than or equal to series year");
      return;
    }

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    const { data, error: createError } = await createCurriculum({
      major_id: formData.major_id,
      title: formData.title,
      series_year: parsedSeriesYear,
      revised_year: parsedRevisedYear,
    });

    setIsSaving(false);

    if (createError) {
      setError(createError);
      return;
    }

    setShowSuccess(true);

    setTimeout(() => {
      if (data?.id) {
        router.push(`${basePath}/${data.id}`);
      } else {
        router.push(basePath);
      }
    }, 1200);
  };

  return (
    <AdminPanel
      title="Create Curriculum"
      icon={CirclePlus}
      onClose={() => router.push(basePath)}
    >
      <div className="space-y-4">
        <FormStatusBanner
          success={
            showSuccess
              ? {
                  title: "Curriculum created",
                  message: "Record created successfully. Redirecting...",
                }
              : undefined
          }
          error={error}
        />

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
                setFormData((prev) => ({ ...prev, major_id: "" }));
                setError("");
              }}
              disabled={isSaving || isLoadingOptions}
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
                setFormData((prev) => ({ ...prev, major_id: "" }));
                setError("");
              }}
              disabled={isSaving || isLoadingOptions || !selectedDepartmentId}
            >
              <option value="">Select program...</option>
              {filteredProgramOptions.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name} ({program.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <CurriculumInitialForm
          formData={formData}
          onChange={handleChange}
          onReset={handleReset}
          onSubmit={handleCreate}
          isSaving={isSaving || isLoadingOptions}
          submitLabel="Create Curriculum"
          submitLoadingLabel="Creating..."
          majorOptions={filteredMajorOptions}
        />
      </div>
    </AdminPanel>
  );
};
