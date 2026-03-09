"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle,
  Shield,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createUser } from "@/lib/users/actions";
import Link from "next/link";
import { UserInitialFormState } from "@/components/admin/users/user-initial-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";

const initialFormState: UserInitialFormState = {
  email: "",
  password: "",
  name: "",
  birthDate: "",
  address: "",
  contactNumber: "",
  employmentStatus: "Regular",
};

export const UserCreate = () => {
  const router = useRouter();
  const [formData, setFormData] =
    useState<UserInitialFormState>(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [createAsAdmin, setCreateAsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (field: keyof UserInitialFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setCreateAsAdmin(false);
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

    if (!formData.name.trim()) {
      setError("Full name is required");
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
      is_admin: createAsAdmin,
      name: formData.name.trim(),
      birth_date: formData.birthDate,
      address: formData.address.trim() || null,
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
    <Card className="overflow-hidden gap-0 py-0 h-full">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-foreground/10 py-6">
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Create New User
        </CardTitle>
        <div className="flex flex-row items-center gap-4">
          <Link href="/users/" className="text-foreground">
            <X />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="overflow-y-auto flex flex-col gap-8 py-6">
        <div className="space-y-4">
          {showSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <p className="text-xs text-green-900">
                Account created successfully. Redirecting...
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-900">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Lock className="w-5 h-5" />
                <h3 className=" font-semibold">Authentication Credentials</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs" htmlFor="email">
                    Email *
                  </Label>
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

                <div>
                  <Label className="text-xs" htmlFor="password">
                    Password *
                  </Label>
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
                <div className="rounded-md border border-input bg-background/50 p-3">
                  <div className="flex items-start gap-3">
                    <input
                      id="createAsAdmin"
                      type="checkbox"
                      checked={createAsAdmin}
                      onChange={(event) =>
                        setCreateAsAdmin(event.target.checked)
                      }
                      className="mt-0.5 h-4 w-4 accent-foreground"
                      disabled={isSaving}
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="createAsAdmin"
                        className="text-xs font-medium"
                      >
                        Create as Admin Account
                      </Label>
                      <p className="text-xs text-foreground/60">
                        When enabled, this account will be required to confirm
                        an email address and will have an administrative
                        privileges.
                      </p>
                      {createAsAdmin && (
                        <div className="inline-flex items-center gap-1 text-xs text-foreground/80">
                          <Shield className="h-3.5 w-3.5" />
                          Role metadata:{" "}
                          <span className="font-mono">user_role=ADMIN</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <User className="w-5 h-5" />
                <h3 className=" font-semibold">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-xs" htmlFor="name">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(event) =>
                      handleChange("name", event.target.value)
                    }
                    onBlur={(event) =>
                      handleChange("name", event.target.value.trim())
                    }
                    className="mt-1"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <Label className="text-xs" htmlFor="birthDate">
                    Birth Date *
                  </Label>
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
                  <Label className="text-xs" htmlFor="contactNumber">
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
                  <Label className="text-xs" htmlFor="address">
                    Address
                  </Label>
                  <Input
                    id="address"
                    placeholder="Enter address"
                    value={formData.address}
                    onChange={(event) =>
                      handleChange("address", event.target.value)
                    }
                    onBlur={(event) =>
                      handleChange("address", event.target.value.trim())
                    }
                    className="mt-1"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <Label className="text-xs" htmlFor="employmentStatus">
                    Employment Status
                  </Label>
                  <select
                    id="employmentStatus"
                    value={formData.employmentStatus}
                    onChange={(event) =>
                      handleChange("employmentStatus", event.target.value)
                    }
                    className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                    disabled={isSaving}
                  >
                    <option value="Regular">Regular</option>
                    <option value="Part-time">Part Time</option>
                    <option value="Contract of Service">
                      Contract of Service
                    </option>
                    <option value="Temporary">Temporary</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
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
