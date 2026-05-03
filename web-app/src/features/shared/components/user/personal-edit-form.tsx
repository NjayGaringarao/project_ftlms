"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeName } from "@/features/profile/lib/user-edit/validators";
import FormStatusBanner from "@/features/admin/components/form-status-banner";

type PersonalEditValues = {
  name: string;
  birthDate: string;
  address: string;
  contactNumber: string;
};

type PersonalEditFormProps = {
  initialValues: PersonalEditValues;
  onSave: (values: PersonalEditValues) => Promise<{ error?: string }>;
  isSaving?: boolean;
  submitText?: string;
  savingText?: string;
};

const PersonalEditForm = ({
  initialValues,
  onSave,
  isSaving = false,
  submitText = "Save Changes",
  savingText = "Saving...",
}: PersonalEditFormProps) => {
  const [formData, setFormData] = useState<PersonalEditValues>(initialValues);
  const [savedData, setSavedData] = useState<PersonalEditValues>(initialValues);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const hasChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(savedData),
    [formData, savedData],
  );

  const handleChange = (field: keyof PersonalEditValues, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleReset = () => {
    setFormData(savedData);
    setError("");
    setShowSuccess(false);
  };

  const handleSave = async () => {
    const normalizedName = normalizeName(formData.name);

    if (!normalizedName) {
      setError("Full name is required");
      return;
    }
    if (!formData.birthDate.trim()) {
      setError("Birth date is required");
      return;
    }

    const payload: PersonalEditValues = {
      name: normalizedName,
      birthDate: formData.birthDate,
      address: formData.address.trim(),
      contactNumber: formData.contactNumber.trim(),
    };

    const { error: saveError } = await onSave(payload);

    if (saveError) {
      setError(saveError);
      return;
    }

    setSavedData(payload);
    setFormData(payload);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="space-y-4">
      <FormStatusBanner
        variant="compact"
        success={
          showSuccess
            ? { title: "Personal information saved successfully" }
            : undefined
        }
        error={error}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="fullName" className="text-xs">
            Full Name *
          </Label>
          <Input
            id="fullName"
            placeholder="Enter full name"
            value={formData.name}
            onChange={(event) => handleChange("name", event.target.value)}
            onBlur={(event) =>
              handleChange("name", normalizeName(event.target.value))
            }
            className="mt-1"
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor="birthDate" className="text-xs">
            Birth Date *
          </Label>
          <Input
            id="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={(event) => handleChange("birthDate", event.target.value)}
            className="mt-1"
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor="contactNumber" className="text-xs">
            Contact Number
          </Label>
          <Input
            id="contactNumber"
            placeholder="Enter contact number"
            value={formData.contactNumber}
            onChange={(event) =>
              handleChange("contactNumber", event.target.value)
            }
            className="mt-1"
            disabled={isSaving}
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="address" className="text-xs">
            Address
          </Label>
          <textarea
            id="address"
            placeholder="Enter address"
            value={formData.address}
            onChange={(event) => handleChange("address", event.target.value)}
            className="mt-1 min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
          />
        </div>
      </div>

      {hasChanges && (
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? savingText : submitText}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PersonalEditForm;
