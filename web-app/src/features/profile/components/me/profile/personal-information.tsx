"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Identity } from "@/features/shared/types/models/identity";
import { upsertIdentityForCurrentUser } from "@/features/profile/lib/me/profile";

type PersonalInformationProps = {
  initialIdentity: Identity | null;
};

type FormState = {
  fullName: string;
  birthDate: string;
  address: string;
  contactNumber: string;
};

const identityToFormState = (identity: Identity | null): FormState => ({
  fullName: identity?.name ?? "",
  birthDate: identity?.birth_date ?? "",
  address: identity?.address ?? "",
  contactNumber: identity?.contact_number ?? "",
});

const normalizeOptional = (value: string) =>
  value.trim().length > 0 ? value.trim() : null;

const PersonalInformation = ({ initialIdentity }: PersonalInformationProps) => {
  const [formData, setFormData] = useState<FormState>(() =>
    identityToFormState(initialIdentity),
  );
  const [savedData, setSavedData] = useState<FormState>(() =>
    identityToFormState(initialIdentity),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const hasChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(savedData),
    [formData, savedData],
  );

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleReset = () => {
    setFormData(savedData);
    setError("");
    setShowSuccess(false);
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      setError("Full name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    const { data, error: saveError } = await upsertIdentityForCurrentUser({
      name: formData.fullName.trim(),
      birth_date: normalizeOptional(formData.birthDate),
      address: normalizeOptional(formData.address),
      contact_number: normalizeOptional(formData.contactNumber),
    });

    setIsSaving(false);

    if (saveError) {
      setError(saveError);
      return;
    }

    const updatedFormState = data ? identityToFormState(data) : { ...formData };
    setSavedData(updatedFormState);
    setFormData(updatedFormState);
    setShowSuccess(true);

    setTimeout(() => setShowSuccess(false), 8000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(event) =>
                  handleChange("fullName", event.target.value)
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(event) =>
                  handleChange("birthDate", event.target.value)
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                placeholder="Enter your contact number"
                value={formData.contactNumber}
                onChange={(event) =>
                  handleChange("contactNumber", event.target.value)
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Enter your address"
                value={formData.address}
                onChange={(event) =>
                  handleChange("address", event.target.value)
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-between items-center pt-2">
            <div className="flex flex-1">
              {showSuccess && (
                <div className="w-full px-4 py-2 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">
                    Your personal information has been saved.
                  </p>
                </div>
              )}

              {error && (
                <div className="w-full px-4 py-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-red-900">{error}</p>
                </div>
              )}
            </div>

            {hasChanges && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSaving}
                >
                  Reset
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInformation;
