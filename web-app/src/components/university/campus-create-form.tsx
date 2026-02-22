"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Building2, CheckCircle, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createCampus } from "@/lib/university/actions";

type FormState = {
  name: string;
  address: string;
  zip_code: string;
};

const initialFormState: FormState = {
  name: "",
  address: "",
  zip_code: "",
};

export const CampusCreateForm = () => {
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
    if (!formData.name.trim()) {
      setError("Campus name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    const { data, error: createError } = await createCampus({
      name: formData.name,
      address: formData.address,
      zip_code: formData.zip_code,
    });

    setIsSaving(false);

    if (createError) {
      setError(createError);
      return;
    }

    setShowSuccess(true);

    setTimeout(() => {
      if (data?.id) {
        router.push(`/university/campuses/${data.id}`);
      } else {
        router.push("/university/campuses");
      }
    }, 1200);
  };

  return (
    <Card className="mt-4 mr-4 overflow-hidden gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-foreground/10 py-6">
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Campus Information
        </CardTitle>
        <div className="flex flex-row items-center gap-4">
          <Link href="/university/campuses" className="text-foreground">
            <X />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="overflow-y-auto flex flex-col gap-8 py-6">
        <div className="space-y-4">
          {showSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Campus Created</p>
                <p className="text-sm text-green-800">
                  Record created successfully. Redirecting...
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

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Building2 className="w-5 h-5" />
              <h3 className="font-semibold">Campus Profile</h3>
            </div>

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
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
              Reset
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? "Creating..." : "Create Campus"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
