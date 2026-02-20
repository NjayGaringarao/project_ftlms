"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, Building2, CheckCircle, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Campus } from "@/models/campus";
import { updateCampus } from "@/lib/university/actions";
import { DirectorOption } from "@/lib/university/campuses";

type CampusEditFormProps = {
  campus: Campus;
  directors: DirectorOption[];
};

type FormState = {
  name: string;
  director_id: string;
  address: string;
  zip_code: string;
};

const campusToFormState = (campus: Campus): FormState => ({
  name: campus.name,
  director_id: campus.director_id ?? "",
  address: campus.address ?? "",
  zip_code: campus.zip_code ?? "",
});

export const CampusEditForm = ({ campus, directors }: CampusEditFormProps) => {
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
      director_id: formData.director_id || null,
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
      director_id: formData.director_id,
      address: formData.address.trim(),
      zip_code: formData.zip_code.trim(),
    };

    setSavedFormData(newSavedState);
    setFormData(newSavedState);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <Card className="mt-4 mr-4 mb-4 overflow-hidden gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-foreground/10 py-6">
        <CardTitle className="flex items-center gap-2">
          <Save className="w-5 h-5" />
          Edit Campus
        </CardTitle>
        <div className="flex flex-row items-center gap-4">
          <Link
            href={`/university/campuses/${campus.id}`}
            className="text-foreground"
          >
            <X />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="overflow-y-auto h-full flex flex-col gap-6 py-4">
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

            <div>
              <Label className="text-xs" htmlFor="director_id">
                Director
              </Label>
              <select
                id="director_id"
                className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                value={formData.director_id}
                onChange={(event) =>
                  handleChange("director_id", event.target.value)
                }
                disabled={isSaving}
              >
                <option value="">No director assigned</option>
                {directors.map((director) => (
                  <option key={director.id} value={director.id}>
                    {director.name}
                    {director.email ? ` (${director.email})` : ""}
                  </option>
                ))}
              </select>
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
      </CardContent>
    </Card>
  );
};
