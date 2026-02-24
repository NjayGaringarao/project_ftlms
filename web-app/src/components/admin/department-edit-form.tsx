"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Department } from "@/models/department";
import { updateDepartment } from "@/lib/admin/actions";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";

type DepartmentEditFormProps = {
  department: Department;
};

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

const departmentToFormState = (department: Department): FormState => ({
  code: department.code,
  name: department.name,
  type: (department.type as FormState["type"]) ?? "ACADEMIC",
  description: department.description ?? "",
});

export const DepartmentEditForm = ({ department }: DepartmentEditFormProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormState>(() =>
    departmentToFormState(department),
  );
  const [savedFormData, setSavedFormData] = useState<FormState>(() =>
    departmentToFormState(department),
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleReset = () => {
    setFormData(savedFormData);
    setError("");
    setSuccess(false);
  };

  const handleSave = async () => {
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
    setSuccess(false);

    const { error: updateError } = await updateDepartment({
      id: department.id,
      code: formData.code,
      name: formData.name,
      type: formData.type,
      description: formData.description,
    });

    setIsSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    const newSavedState = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      type: formData.type,
      description: formData.description.trim(),
    };

    setSavedFormData(newSavedState);
    setFormData(newSavedState);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <AdminPanel
      title="Edit Department"
      icon={Save}
      onClose={() => router.push(`/departments/${department.id}`)}
    >
      <>
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Building2 className="w-5 h-5" />
            <h3 className="font-semibold">Department Profile</h3>
          </div>

          <FormStatusBanner
            variant="compact"
            success={
              success
                ? {
                    title: "Department updated successfully",
                  }
                : undefined
            }
            error={error}
          />

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
                  handleChange("code", e.target.value.trim().toUpperCase())
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
                  handleChange("type", event.target.value as FormState["type"])
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

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
              Reset
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </>
    </AdminPanel>
  );
};
