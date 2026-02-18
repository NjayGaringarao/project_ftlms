"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, User, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UsersListItem } from "@/lib/users/users";
import { updateUserProfile } from "@/lib/users/actions";
import Link from "next/link";

type UserEditFormProps = {
  user: UsersListItem;
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
  employmentStatus: string;
};

const userToFormState = (user: UsersListItem): FormState => ({
  firstName: user.identity?.first_name ?? "",
  middleName: user.identity?.middle_name ?? "",
  lastName: user.identity?.last_name ?? "",
  extension: user.identity?.extension ?? "",
  birthDate: user.identity?.birth_date ?? "",
  address: user.identity?.address ?? "",
  zipCode: user.identity?.zip_code ?? "",
  contactNumber: user.identity?.contact_number ?? "",
  employmentStatus: user.employment_status ?? "",
});

export const UserEditForm = ({ user }: UserEditFormProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormState>(() =>
    userToFormState(user),
  );
  const [savedData, setSavedData] = useState<FormState>(() =>
    userToFormState(user),
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

    const { data, error: saveError } = await updateUserProfile({
      user_id: user.id,
      first_name: formData.firstName.trim(),
      middle_name: formData.middleName.trim() || null,
      last_name: formData.lastName.trim(),
      extension: formData.extension.trim() || null,
      birth_date: formData.birthDate,
      address: formData.address.trim() || null,
      zip_code: formData.zipCode.trim() || null,
      contact_number: formData.contactNumber.trim() || null,
      employment_status: formData.employmentStatus.trim() || null,
    });

    setIsSaving(false);

    if (saveError) {
      setError(saveError);
      return;
    }

    setSavedData({ ...formData });
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      router.push(`/users/${user.id}`);
    }, 1500);
  };

  return (
    <Card className="m-6">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Edit User Profile
        </CardTitle>
        <div className="flex flex-row items-center gap-4">
          <Link href={`/users/${user?.id}`} className="text-foreground">
            <X />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="overflow-y-auto">
        <div className="space-y-4">
          {showSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Profile Updated</p>
                <p className="text-sm text-green-800">
                  Changes saved successfully. Redirecting...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-red-900">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={(event) =>
                  handleChange("firstName", event.target.value)
                }
                className="mt-1"
                disabled={isSaving}
                onBlur={(event) => {
                  handleChange(
                    "firstName",
                    event.target.value.trim().toUpperCase(),
                  );
                }}
              />
            </div>

            <div>
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                placeholder="Enter middle name"
                value={formData.middleName}
                onChange={(event) =>
                  handleChange("middleName", event.target.value)
                }
                onBlur={(event) => {
                  handleChange(
                    "middleName",
                    event.target.value.trim().toUpperCase(),
                  );
                }}
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={(event) =>
                  handleChange("lastName", event.target.value)
                }
                onBlur={(event) => {
                  handleChange(
                    "lastName",
                    event.target.value.trim().toUpperCase(),
                  );
                }}
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="extension">Extension</Label>
              <Input
                id="extension"
                placeholder="e.g. JR., III"
                value={formData.extension}
                onChange={(event) =>
                  handleChange("extension", event.target.value)
                }
                onBlur={(event) => {
                  handleChange(
                    "extension",
                    event.target.value.trim().toUpperCase(),
                  );
                }}
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="birthDate">Birth Date *</Label>
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
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Enter address"
                value={formData.address}
                onChange={(event) =>
                  handleChange("address", event.target.value)
                }
                onBlur={(event) => {
                  handleChange(
                    "address",
                    event.target.value.trim().toUpperCase(),
                  );
                }}
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                placeholder="Enter ZIP code"
                value={formData.zipCode}
                onChange={(event) =>
                  handleChange("zipCode", event.target.value)
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="employmentStatus">Employment Status</Label>
              <Input
                id="employmentStatus"
                placeholder="e.g. FULL_TIME, PART_TIME"
                value={formData.employmentStatus}
                onChange={(event) =>
                  handleChange("employmentStatus", event.target.value)
                }
                onBlur={(event) =>
                  handleChange(
                    "employmentStatus",
                    event.target.value.trim().toUpperCase(),
                  )
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
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
