"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createCampus } from "@/lib/admin/actions";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";
import { CampusInitialForm, type CampusFormState } from "./campus-initial-form";

const initialFormState: CampusFormState = {
  name: "",
  address: "",
  zip_code: "",
};

export const CampusCreate = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<CampusFormState>(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (field: keyof CampusFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setError("");
    setShowSuccess(false);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setError("Campus name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    const { data, error: createError } = await createCampus({
      name: formData.name,
      address: formData.address,
      zip_code: formData.zip_code,
    });

    setIsSaving(false);

    if (createError) {
      setError(createError);
      return;
    }

    setShowSuccess(true);

    setTimeout(() => {
      if (data?.id) {
        router.push(`/campuses/${data.id}`);
      } else {
        router.push("/campuses");
      }
    }, 1200);
  };

  return (
    <AdminPanel
      title="Campus Information"
      icon={Plus}
      onClose={() => router.back()}
    >
      <>
        <div className="space-y-4">
          <FormStatusBanner
            success={
              showSuccess
                ? {
                    title: "Campus Created",
                    message: "Record created successfully. Redirecting...",
                  }
                : undefined
            }
            error={error}
          />

          <CampusInitialForm
            formData={formData}
            onChange={handleChange}
            onReset={handleReset}
            onSubmit={handleCreate}
            isSaving={isSaving}
            submitLabel="Create Campus"
            submitLoadingLabel="Creating..."
          />
        </div>
      </>
    </AdminPanel>
  );
};
