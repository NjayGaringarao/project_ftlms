"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createDepartment } from "@/lib/admin/actions";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";

type FormState = {
  code: string;
  name: string;
  type:
    | "ACADEMIC"
    | "ADMINISTRATIVE"
    | "STUDENT_SERVICES"
    | "EXTENSION_SERVICES";
  description: string;
};

const initialFormState: FormState = {
  code: "",
  name: "",
  type: "ACADEMIC",
  description: "",
};

export const DepartmentCreateForm = () => {
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
    if (!formData.code.trim()) {
      setError("Department code is required");
      return;
    }

    if (!formData.name.trim()) {
      setError("Department name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    const { data, error: createError } = await createDepartment({
      code: formData.code,
      name: formData.name,
      type: formData.type,
      description: formData.description,
    });

    setIsSaving(false);

    if (createError) {
      setError(createError);
      return;
    }

    setShowSuccess(true);

    setTimeout(() => {
      if (data?.id) {
        router.push(`/departments/${data.id}`);
      } else {
        router.push("/departments");
      }
    }, 1200);
  };

  return (
    <AdminPanel
      title="Department Information"
      icon={Plus}
      onClose={() => router.push("/departments")}
    >
      <>
        <div className="space-y-4">
          <FormStatusBanner
            success={
              showSuccess
                ? {
                    title: "Department Created",
                    message: "Record created successfully. Redirecting...",
                  }
                : undefined
            }
            error={error}
          />

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Building2 className="w-5 h-5" />
              <h3 className="font-semibold">Department Profile</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs" htmlFor="code">
                  Department Code *
                </Label>
                <Input
                  id="code"
                  placeholder="e.g. CCS"
                  value={formData.code}
                  onChange={(event) => handleChange("code", event.target.value)}
                  onBlur={(e) =>
                    handleChange("code", e.target.value.toUpperCase().trim())
                  }
                  className="mt-1"
                  disabled={isSaving}
                />
              </div>

              <div>
                <Label className="text-xs" htmlFor="name">
                  Department Name *
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. College of Computer Studies"
                  value={formData.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  onBlur={(e) => handleChange("name", e.target.value.trim())}
                  className="mt-1"
                  disabled={isSaving}
                />
              </div>

              <div>
                <Label className="text-xs" htmlFor="type">
                  Department Type *
                </Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(event) =>
                    handleChange(
                      "type",
                      event.target.value as FormState["type"],
                    )
                  }
                  className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                  disabled={isSaving}
                >
                  <option value="ACADEMIC">Academic</option>
                  <option value="ADMINISTRATIVE">Administrative</option>
                  <option value="STUDENT_SERVICES">Student Services</option>
                  <option value="EXTENSION_SERVICES">Extension Services</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs" htmlFor="description">
                  Description
                </Label>
                <Input
                  id="description"
                  placeholder="Enter department description"
                  value={formData.description}
                  onChange={(event) =>
                    handleChange("description", event.target.value)
                  }
                  onBlur={(e) =>
                    handleChange("description", e.target.value.trim())
                  }
                  className="mt-1"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
              Reset
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? "Creating..." : "Create Department"}
            </Button>
          </div>
        </div>
      </>
    </AdminPanel>
  );
};
