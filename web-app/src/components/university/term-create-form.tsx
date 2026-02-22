"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Calendar, CheckCircle, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createTerm } from "@/lib/university/actions";

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
        router.push(`/university/terms/${data.id}`);
      } else {
        router.push("/university/terms");
      }
    }, 1200);
  };

  return (
    <Card className="mt-4 mr-4 overflow-hidden gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-foreground/10 py-6">
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Term Information
        </CardTitle>
        <div className="flex flex-row items-center gap-4">
          <Link href="/university/terms" className="text-foreground">
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
                <p className="font-semibold text-green-900">Term Created</p>
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
                  placeholder="e.g. 1ST"
                  value={formData.term_code}
                  onChange={(event) =>
                    handleChange("term_code", event.target.value)
                  }
                  className="mt-1"
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
      </CardContent>
    </Card>
  );
};
