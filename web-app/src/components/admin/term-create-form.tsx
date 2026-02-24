"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createTerm } from "@/lib/admin/actions";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";

type FormState = {
  academic_year: string;
  term_code: string;
  sequence: string;
  start: string;
  end: string;
};

const initialFormState: FormState = {
  academic_year: "",
  term_code: "",
  sequence: "",
  start: "",
  end: "",
};

export const TermCreateForm = () => {
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
    if (!formData.academic_year.trim()) {
      setError("Academic year is required");
      return;
    }

    if (!formData.term_code.trim()) {
      setError("Term code is required");
      return;
    }

    const parsedSequence = Number(formData.sequence);
    if (!Number.isFinite(parsedSequence)) {
      setError("Term sequence must be a number");
      return;
    }

    if (!formData.start.trim()) {
      setError("Start date is required");
      return;
    }

    if (!formData.end.trim()) {
      setError("End date is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    const { data, error: createError } = await createTerm({
      academic_year: formData.academic_year,
      term_code: formData.term_code,
      sequence: parsedSequence,
      start: formData.start,
      end: formData.end,
    });

    setIsSaving(false);

    if (createError) {
      setError(createError);
      return;
    }

    setShowSuccess(true);

    setTimeout(() => {
      if (data?.id) {
        router.push(`/academic-terms/${data.id}`);
      } else {
        router.push("/academic-terms");
      }
    }, 1200);
  };

  return (
    <AdminPanel
      title="Term Information"
      icon={Plus}
      onClose={() => router.push("/academic-terms")}
    >
      <>
        <div className="space-y-4">
          <FormStatusBanner
            success={
              showSuccess
                ? {
                    title: "Term Created",
                    message: "Record created successfully. Redirecting...",
                  }
                : undefined
            }
            error={error}
          />

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Calendar className="w-5 h-5" />
              <h3 className="font-semibold">Term Profile</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs" htmlFor="academic_year">
                  Academic Year *
                </Label>
                <Input
                  id="academic_year"
                  placeholder="e.g. 2025-2026"
                  value={formData.academic_year}
                  onChange={(event) =>
                    handleChange("academic_year", event.target.value)
                  }
                  onBlur={(e) =>
                    handleChange("academic_year", e.target.value.trim())
                  }
                  className="mt-1"
                  disabled={isSaving}
                />
              </div>

              <div>
                <Label className="text-xs" htmlFor="term_code">
                  Term Code *
                </Label>
                <Input
                  id="term_code"
                  placeholder="e.g. FIRST"
                  value={formData.term_code}
                  onChange={(event) =>
                    handleChange("term_code", event.target.value)
                  }
                  onBlur={(e) =>
                    handleChange(
                      "term_code",
                      e.target.value.trim().toUpperCase(),
                    )
                  }
                  disabled={isSaving}
                />
              </div>

              <div>
                <Label className="text-xs" htmlFor="sequence">
                  Sequence *
                </Label>
                <Input
                  id="sequence"
                  type="number"
                  placeholder="e.g. 1"
                  value={formData.sequence}
                  onChange={(event) =>
                    handleChange("sequence", event.target.value)
                  }
                  onBlur={(e) =>
                    handleChange("sequence", e.target.value.trim())
                  }
                  className="mt-1"
                  disabled={isSaving}
                />
              </div>

              <div>
                <Label className="text-xs" htmlFor="start">
                  Start Date *
                </Label>
                <Input
                  id="start"
                  type="date"
                  value={formData.start}
                  onChange={(event) =>
                    handleChange("start", event.target.value)
                  }
                  className="mt-1"
                  disabled={isSaving}
                />
              </div>

              <div>
                <Label className="text-xs" htmlFor="end">
                  End Date *
                </Label>
                <Input
                  id="end"
                  type="date"
                  value={formData.end}
                  onChange={(event) => handleChange("end", event.target.value)}
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
              {isSaving ? "Creating..." : "Create Term"}
            </Button>
          </div>
        </div>
      </>
    </AdminPanel>
  );
};
