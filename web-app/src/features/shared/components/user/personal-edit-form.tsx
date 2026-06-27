"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormStatusBanner from "@/features/admin/components/form-status-banner";

type PersonalEditValues = {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  professionalExtension: string;
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
    if (!formData.firstName.trim()) {
      setError("First name is required");
      return;
    }
    if (!formData.lastName.trim()) {
      setError("Last name is required");
      return;
    }
    if (!formData.birthDate.trim()) {
      setError("Birth date is required");
      return;
    }

    const payload: PersonalEditValues = {
      firstName: formData.firstName.trim(),
      middleName: formData.middleName.trim(),
      lastName: formData.lastName.trim(),
      suffix: formData.suffix.trim(),
      professionalExtension: formData.professionalExtension.trim(),
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
        <div>
          <Label htmlFor="firstName" className="text-xs">
            First Name *
          </Label>
          <Input
            id="firstName"
            placeholder="Enter first name"
            value={formData.firstName}
            onChange={(event) => handleChange("firstName", event.target.value)}
            onBlur={(event) =>
              handleChange("firstName", event.target.value.trim().toUpperCase())
            }
            className="mt-1"
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor="middleName" className="text-xs">
            Middle Name
          </Label>
          <Input
            id="middleName"
            placeholder="Enter middle name"
            value={formData.middleName}
            onChange={(event) => handleChange("middleName", event.target.value)}
            onBlur={(event) =>
              handleChange("middleName", event.target.value.trim().toUpperCase())
            }
            className="mt-1"
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor="lastName" className="text-xs">
            Last Name *
          </Label>
          <Input
            id="lastName"
            placeholder="Enter last name"
            value={formData.lastName}
            onChange={(event) => handleChange("lastName", event.target.value)}
            onBlur={(event) =>
              handleChange("lastName", event.target.value.trim().toUpperCase())
            }
            className="mt-1"
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor="suffix" className="text-xs">
            Suffix
          </Label>
          <Input
            id="suffix"
            placeholder="e.g. JR., SR., III"
            value={formData.suffix}
            onChange={(event) => handleChange("suffix", event.target.value)}
            onBlur={(event) =>
              handleChange("suffix", event.target.value.trim().toUpperCase())
            }
            className="mt-1"
            disabled={isSaving}
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="professionalExtension" className="text-xs">
            Professional Extension
          </Label>
          <Input
            id="professionalExtension"
            placeholder="e.g. PhD, CPA, RN"
            value={formData.professionalExtension}
            onChange={(event) =>
              handleChange("professionalExtension", event.target.value)
            }
            onBlur={(event) =>
              handleChange("professionalExtension", event.target.value.trim())
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
          <Input
            id="address"
            placeholder="Enter address"
            value={formData.address}
            onChange={(event) => handleChange("address", event.target.value)}
            className="mt-1"
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
