"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createDepartment } from "@/lib/admin/actions";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";
import {
  DepartmentInitialForm,
  type DepartmentFormState,
} from "./department-initial-form";

const initialFormState: DepartmentFormState = {
  code: "",
  name: "",
  type: "ACADEMIC",
  description: "",
};

export const DepartmentCreate = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<DepartmentFormState>(
    initialFormState,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (field: keyof DepartmentFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setError("");
    setShowSuccess(false);
  };

  const handleCreate = async () => {
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
    setShowSuccess(false);

    const { data, error: createError } = await createDepartment({
      code: formData.code,
      name: formData.name,
      type: formData.type,
      description: formData.description,
    });

    setIsSaving(false);

    if (createError) {
      setError(createError);
      return;
    }

    setShowSuccess(true);

    setTimeout(() => {
      if (data?.id) {
        router.push(`/departments/${data.id}`);
      } else {
        router.push("/departments");
      }
    }, 1200);
  };

  return (
    <AdminPanel
      title="Department Information"
      icon={Plus}
      onClose={() => router.push("/departments")}
    >
      <>
        <div className="space-y-4">
          <FormStatusBanner
            success={
              showSuccess
                ? {
                    title: "Department Created",
                    message: "Record created successfully. Redirecting...",
                  }
                : undefined
            }
            error={error}
          />

          <DepartmentInitialForm
            formData={formData}
            onChange={handleChange}
            onReset={handleReset}
            onSubmit={handleCreate}
            isSaving={isSaving}
            submitLabel="Create Department"
            submitLoadingLabel="Creating..."
          />
        </div>
      </>
    </AdminPanel>
  );
};
