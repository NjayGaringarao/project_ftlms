"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createRank } from "@/lib/admin/actions";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";

type FormState = {
  number: string;
  title: string;
  description: string;
};

const initialFormState: FormState = {
  number: "",
  title: "",
  description: "",
};

export const RankCreateForm = () => {
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
    const parsedNumber = Number(formData.number);

    if (!Number.isFinite(parsedNumber)) {
      setError("Rank number is required");
      return;
    }

    if (!formData.title.trim()) {
      setError("Rank title is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    const { data, error: createError } = await createRank({
      number: parsedNumber,
      title: formData.title,
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
        router.push(`/academic-ranks/${data.id}`);
      } else {
        router.push("/academic-ranks");
      }
    }, 1200);
  };

  return (
    <AdminPanel
      title="Rank Information"
      icon={Plus}
      onClose={() => router.push("/academic-ranks")}
    >
      <>
        <div className="space-y-4">
          <FormStatusBanner
            success={
              showSuccess
                ? {
                    title: "Rank Created",
                    message: "Record created successfully. Redirecting...",
                  }
                : undefined
            }
            error={error}
          />

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Trophy className="w-5 h-5" />
              <h3 className="font-semibold">Rank Profile</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs" htmlFor="number">
                  Rank Number *
                </Label>
                <Input
                  id="number"
                  type="number"
                  placeholder="e.g. 1"
                  value={formData.number}
                  onChange={(event) =>
                    handleChange("number", event.target.value)
                  }
                  className="mt-1"
                  disabled={isSaving}
                />
              </div>

              <div>
                <Label className="text-xs" htmlFor="title">
                  Rank Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Assistant Professor"
                  value={formData.title}
                  onChange={(event) =>
                    handleChange("title", event.target.value)
                  }
                  className="mt-1"
                  disabled={isSaving}
                  onBlur={(e) => handleChange("title", e.target.value.trim())}
                />
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs" htmlFor="description">
                  Description
                </Label>
                <Input
                  id="description"
                  placeholder="Enter rank description"
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
              {isSaving ? "Creating..." : "Create Rank"}
            </Button>
          </div>
        </div>
      </>
    </AdminPanel>
  );
};
