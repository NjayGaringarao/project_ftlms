"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit } from "lucide-react";
import { Campus } from "@/models/campus";
import { updateCampus } from "@/lib/admin/actions";
import AdminPanel from "../admin-panel";
import FormStatusBanner from "../form-status-banner";
import { CampusInitialForm, type CampusFormState } from "./campus-initial-form";

type CampusEditFormProps = {
  campus: Campus;
};

const campusToFormState = (campus: Campus): CampusFormState => ({
  code: campus.code,
  name: campus.name,
  address: campus.address ?? "",
});

export const CampusEdit = ({ campus }: CampusEditFormProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState<CampusFormState>(() =>
    campusToFormState(campus),
  );
  const [savedFormData, setSavedFormData] = useState<CampusFormState>(() =>
    campusToFormState(campus),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof CampusFormState, value: string) => {
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
      setError("Campus code is required");
      return;
    }

    if (!formData.name.trim()) {
      setError("Campus name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess(false);

    const { error: updateError } = await updateCampus({
      id: campus.id,
      code: formData.code,
      name: formData.name,
      address: formData.address,
    });

    setIsSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    const newSavedState = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      address: formData.address.trim(),
    };

    setSavedFormData(newSavedState);
    setFormData(newSavedState);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <AdminPanel
      title="Edit Campus"
      icon={Edit}
      onClose={() => router.push(`/campuses/${campus.id}`)}
    >
      <>
        <div className="space-y-4">
          <CampusInitialForm
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
                        title: "Campus updated successfully",
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
