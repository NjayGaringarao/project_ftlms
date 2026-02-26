"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Save } from "lucide-react";
import { Department } from "@/models/department";
import { updateDepartment } from "@/lib/admin/actions";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";
import {
  DepartmentInitialForm,
  type DepartmentFormState,
} from "./department-initial-form";

type DepartmentEditFormProps = {
  department: Department;
};

const departmentToFormState = (
  department: Department,
): DepartmentFormState => ({
  code: department.code,
  name: department.name,
  type: (department.type as DepartmentFormState["type"]) ?? "ACADEMIC",
  description: department.description ?? "",
});

export const DepartmentEdit = ({ department }: DepartmentEditFormProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState<DepartmentFormState>(() =>
    departmentToFormState(department),
  );
  const [savedFormData, setSavedFormData] = useState<DepartmentFormState>(() =>
    departmentToFormState(department),
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof DepartmentFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleReset = () => {
    setFormData(savedFormData);
    setError("");
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
      setError("Department code is required");
      return;
    }

    if (!formData.name.trim()) {
      setError("Department name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess(false);

    const { error: updateError } = await updateDepartment({
      id: department.id,
      code: formData.code,
      name: formData.name,
      type: formData.type,
      description: formData.description,
    });

    setIsSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    const newSavedState = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      type: formData.type,
      description: formData.description.trim(),
    };

    setSavedFormData(newSavedState);
    setFormData(newSavedState);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <AdminPanel
      title="Edit Department"
      icon={Edit}
      onClose={() => router.push(`/departments/${department.id}`)}
    >
      <>
        <div className="space-y-4">
          <DepartmentInitialForm
            formData={formData}
            onChange={handleChange}
            onReset={handleReset}
            onSubmit={handleSave}
            isSaving={isSaving}
            submitLabel="Save Changes"
            submitLoadingLabel="Saving..."
            statusSlot={
              <FormStatusBanner
                variant="compact"
                success={
                  success
                    ? {
                        title: "Department updated successfully",
                      }
                    : undefined
                }
                error={error}
              />
            }
          />
        </div>
      </>
    </AdminPanel>
  );
};
