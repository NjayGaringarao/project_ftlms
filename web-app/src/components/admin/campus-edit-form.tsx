"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Building2, CheckCircle, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Campus } from "@/models/campus";
import { updateCampus } from "@/lib/admin/actions";
import AdminPanel from "./admin-panel";

type CampusEditFormProps = {
  campus: Campus;
};

type FormState = {
  name: string;
  address: string;
  zip_code: string;
};

const campusToFormState = (campus: Campus): FormState => ({
  name: campus.name,
  address: campus.address ?? "",
  zip_code: campus.zip_code ?? "",
});

export const CampusEditForm = ({ campus }: CampusEditFormProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormState>(() =>
    campusToFormState(campus),
  );
  const [savedFormData, setSavedFormData] = useState<FormState>(() =>
    campusToFormState(campus),
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
    if (!formData.name.trim()) {
      setError("Campus name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess(false);

    const { error: updateError } = await updateCampus({
      id: campus.id,
      name: formData.name,
      address: formData.address,
      zip_code: formData.zip_code,
    });

    setIsSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    const newSavedState = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      zip_code: formData.zip_code.trim(),
    };

    setSavedFormData(newSavedState);
    setFormData(newSavedState);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <AdminPanel
      title="Edit Campus"
      icon={Save}
      onClose={() => router.push(`/campuses/${campus.id}`)}
    >
      <>
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Building2 className="w-5 h-5" />
            <h3 className="font-semibold">Campus Profile</h3>
          </div>

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <p className="text-xs text-green-900">
                Campus updated successfully
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-900">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs" htmlFor="name">
                Campus Name *
              </Label>
              <Input
                id="name"
                placeholder="e.g. Main Campus"
                value={formData.name}
                onChange={(event) => handleChange("name", event.target.value)}
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
                placeholder="Enter campus address"
                value={formData.address}
                onChange={(event) =>
                  handleChange("address", event.target.value)
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="zip_code">
                ZIP Code
              </Label>
              <Input
                id="zip_code"
                placeholder="Enter ZIP code"
                value={formData.zip_code}
                onChange={(event) =>
                  handleChange("zip_code", event.target.value)
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
