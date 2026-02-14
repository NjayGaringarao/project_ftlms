"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Identity } from "@/models/identity";
import { upsertIdentityForCurrentUser } from "@/lib/me/profile";

type PersonalInformationProps = {
  initialIdentity: Identity | null;
};

type FormState = {
  firstName: string;
  middleName: string;
  lastName: string;
  extension: string;
  birthDate: string;
  address: string;
  zipCode: string;
  contactNumber: string;
};

const identityToFormState = (identity: Identity | null): FormState => ({
  firstName: identity?.first_name ?? "",
  middleName: identity?.middle_name ?? "",
  lastName: identity?.last_name ?? "",
  extension: identity?.extension ?? "",
  birthDate: identity?.birth_date ?? "",
  address: identity?.address ?? "",
  zipCode: identity?.zip_code ?? "",
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

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    const { data, error: saveError } = await upsertIdentityForCurrentUser({
      first_name: formData.firstName.trim(),
      middle_name: normalizeOptional(formData.middleName),
      last_name: formData.lastName.trim(),
      extension: normalizeOptional(formData.extension),
      birth_date: formData.birthDate,
      address: normalizeOptional(formData.address),
      zip_code: normalizeOptional(formData.zipCode),
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
          {showSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Profile Updated</p>
                <p className="text-sm text-green-800">
                  Your personal information has been saved.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-900">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="Enter your first name"
                value={formData.firstName}
                onChange={(event) =>
                  handleChange("firstName", event.target.value)
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                placeholder="Enter your middle name"
                value={formData.middleName}
                onChange={(event) =>
                  handleChange("middleName", event.target.value)
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Enter your last name"
                value={formData.lastName}
                onChange={(event) =>
                  handleChange("lastName", event.target.value)
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="extension">Extension</Label>
              <Input
                id="extension"
                placeholder="e.g. Jr., III"
                value={formData.extension}
                onChange={(event) =>
                  handleChange("extension", event.target.value)
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

            <div>
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                placeholder="Enter your ZIP code"
                value={formData.zipCode}
                onChange={(event) =>
                  handleChange("zipCode", event.target.value)
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
              Reset
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInformation;
