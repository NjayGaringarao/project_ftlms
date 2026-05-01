"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit } from "lucide-react";
import { College } from "@/features/shared/types/models/college";
import { updateDepartment } from "@/features/admin/lib/actions";
import AdminPanel from "../admin-panel";
import FormStatusBanner from "../form-status-banner";
import {
  DepartmentInitialForm,
  type DepartmentFormState,
} from "./department-initial-form";

type DepartmentEditFormProps = {
  college: College;
};

const departmentToFormState = (college: College): DepartmentFormState => ({
  code: college.code,
  name: college.name,
  description: college.description ?? "",
});

export const CollegeEdit = ({ college }: DepartmentEditFormProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState<DepartmentFormState>(() =>
    departmentToFormState(college),
  );
  const [savedFormData, setSavedFormData] = useState<DepartmentFormState>(() =>
    departmentToFormState(college),
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
      setError("College code is required");
      return;
    }

    if (!formData.name.trim()) {
      setError("College name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess(false);

    const { error: updateError } = await updateDepartment({
      id: college.id,
      code: formData.code,
      name: formData.name,
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
      description: formData.description.trim(),
    };

    setSavedFormData(newSavedState);
    setFormData(newSavedState);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <AdminPanel
      title="Edit College"
      icon={Edit}
      onClose={() => router.push(`/colleges/${college.id}`)}
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
                        title: "College updated successfully",
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

export const DepartmentEdit = ({ department }: { department: College }) => (
  <CollegeEdit college={department} />
);
