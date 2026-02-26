"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createUser } from "@/lib/users/actions";
import Link from "next/link";
import {
  UserInitialForm,
  UserInitialFormState,
} from "@/components/admin/users/user-initial-form";

const initialFormState: UserInitialFormState = {
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
  employmentStatus: "FULL_TIME",
};

export const UserCreate = () => {
  const router = useRouter();
  const [formData, setFormData] =
    useState<UserInitialFormState>(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (field: keyof UserInitialFormState, value: string) => {
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
    <Card className="mt-4 mr-4 overflow-hidden gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-foreground/10 py-6">
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          User Information
        </CardTitle>
        <div className="flex flex-row items-center gap-4">
          <Link href="/users/" className="text-foreground">
            <X />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="overflow-y-auto flex flex-col gap-8 py-6">
        <UserInitialForm
          formData={formData}
          onChange={handleChange}
          onReset={handleReset}
          onSubmit={handleCreate}
          isSaving={isSaving}
          error={error}
          success={showSuccess}
          successMessage="Account created successfully. Redirecting..."
          submitText="Create User"
          savingText="Creating..."
          showAuthFields
          showEmploymentStatus
        />
      </CardContent>
    </Card>
  );
};
