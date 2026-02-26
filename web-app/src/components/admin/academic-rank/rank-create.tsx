"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createRank } from "@/lib/admin/actions";
import AdminPanel from "../admin-panel";
import FormStatusBanner from "../form-status-banner";
import { RankInitialForm, type RankFormState } from "./rank-initial-form";

const initialFormState: RankFormState = {
  number: "",
  title: "",
  description: "",
};

export const RankCreate = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<RankFormState>(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (field: keyof RankFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setError("");
    setShowSuccess(false);
  };

  const handleCreate = async () => {
    const parsedNumber = Number(formData.number);

    if (!Number.isFinite(parsedNumber)) {
      setError("Rank number is required");
      return;
    }

    if (!formData.title.trim()) {
      setError("Rank title is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    const { data, error: createError } = await createRank({
      number: parsedNumber,
      title: formData.title,
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
        router.push(`/academic-ranks/${data.id}`);
      } else {
        router.push("/academic-ranks");
      }
    }, 1200);
  };

  return (
    <AdminPanel
      title="Rank Information"
      icon={Plus}
      onClose={() => router.push("/academic-ranks")}
    >
      <>
        <div className="space-y-4">
          <FormStatusBanner
            success={
              showSuccess
                ? {
                    title: "Rank Created",
                    message: "Record created successfully. Redirecting...",
                  }
                : undefined
            }
            error={error}
          />

          <RankInitialForm
            formData={formData}
            onChange={handleChange}
            onReset={handleReset}
            onSubmit={handleCreate}
            isSaving={isSaving}
            submitLabel="Create Rank"
            submitLoadingLabel="Creating..."
          />
        </div>
      </>
    </AdminPanel>
  );
};
