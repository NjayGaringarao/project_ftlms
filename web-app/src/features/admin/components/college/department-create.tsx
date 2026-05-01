"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createDepartment } from "@/features/admin/lib/actions";
import AdminPanel from "../admin-panel";
import FormStatusBanner from "../form-status-banner";
import {
  DepartmentInitialForm,
  type DepartmentFormState,
} from "./department-initial-form";

const initialFormState: DepartmentFormState = {
  code: "",
  name: "",
  description: "",
};

export const CollegeCreate = () => {
  const router = useRouter();
  const [formData, setFormData] =
    useState<DepartmentFormState>(initialFormState);
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
      setError("College code is required");
      return;
    }

    if (!formData.name.trim()) {
      setError("College name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    const { data, error: createError } = await createDepartment({
      code: formData.code,
      name: formData.name,
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
        router.push(`/colleges/${data.id}`);
      } else {
        router.push("/colleges");
      }
    }, 1200);
  };

  return (
    <AdminPanel
      title="College Information"
      icon={Plus}
      onClose={() => router.push("/colleges")}
    >
      <>
        <div className="space-y-4">
          <FormStatusBanner
            success={
              showSuccess
                ? {
                    title: "College Created",
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
            submitLabel="Create College"
            submitLoadingLabel="Creating..."
          />
        </div>
      </>
    </AdminPanel>
  );
};

export const DepartmentCreate = CollegeCreate;
