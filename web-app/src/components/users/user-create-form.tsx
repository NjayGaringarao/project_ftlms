"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createUser } from "@/lib/users/actions";

type FormState = {
  email: string;
  password: string;
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

const initialFormState: FormState = {
  email: "",
  password: "",
  firstName: "",
  middleName: "",
  lastName: "",
  extension: "",
  birthDate: "",
  address: "",
  zipCode: "",
  contactNumber: "",
  employmentStatus: "",
};

export const UserCreateForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setError("");
    setShowSuccess(false);
  };

  const handleCreate = async () => {
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    if (!formData.password.trim()) {
      setError("Password is required");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

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

    const { data, error: createError } = await createUser({
      email: formData.email.trim(),
      password: formData.password.trim(),
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

    if (createError) {
      setError(createError);
      return;
    }

    setShowSuccess(true);

    setTimeout(() => {
      if (data?.id) {
        router.push(`/users/${data.id}`);
      } else {
        router.push("/users");
      }
    }, 1500);
  };

  return (
    <Card className="overflow-hidden m-4 -mb-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Create New User
        </CardTitle>
        <p className="text-sm text-foreground/70">
          Set up a new user account with authentication and profile details
        </p>
      </CardHeader>
      <CardContent className="overflow-y-auto">
        <div className="space-y-4">
          {showSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">User Created</p>
                <p className="text-sm text-green-800">
                  Account created successfully. Redirecting...
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

          <div className="space-y-6">
            {/* Authentication Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3">
                Authentication Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(event) =>
                      handleChange("email", event.target.value)
                    }
                    className="mt-1"
                    disabled={isSaving}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password (min 6 characters)"
                    value={formData.password}
                    onChange={(event) =>
                      handleChange("password", event.target.value)
                    }
                    className="mt-1"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            {/* Personal Information Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3">
                Personal Information
              </h3>
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
                    className="mt-1"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
              Reset
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? "Creating..." : "Create User"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
