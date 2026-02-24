"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Campus } from "@/models/campus";
import { updateCampus } from "@/lib/admin/actions";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";
import { CampusInitialForm, type CampusFormState } from "./campus-initial-form";

type CampusEditFormProps = {
  campus: Campus;
};

const campusToFormState = (campus: Campus): CampusFormState => ({
  name: campus.name,
  address: campus.address ?? "",
  zip_code: campus.zip_code ?? "",
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
    if (!formData.name.trim()) {
      setError("Campus name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess(false);

    const { error: updateError } = await updateCampus({
      id: campus.id,
      name: formData.name,
      address: formData.address,
      zip_code: formData.zip_code,
    });

    setIsSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    const newSavedState = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      zip_code: formData.zip_code.trim(),
    };

    setSavedFormData(newSavedState);
    setFormData(newSavedState);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <AdminPanel
      title="Edit Campus"
      icon={Save}
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
