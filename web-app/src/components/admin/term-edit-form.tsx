"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, Calendar, CheckCircle, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Term } from "@/models/term";
import { updateTerm } from "@/lib/admin/actions";

type TermEditFormProps = {
  term: Term;
};

type FormState = {
  academic_year: string;
  term_code: string;
  sequence: string;
  start: string;
  end: string;
};

const termToFormState = (term: Term): FormState => ({
  academic_year: term.academic_year,
  term_code: term.term_code,
  sequence: String(term.sequence),
  start: term.start ?? "",
  end: term.end ?? "",
});

export const TermEditForm = ({ term }: TermEditFormProps) => {
  const [formData, setFormData] = useState<FormState>(() =>
    termToFormState(term),
  );
  const [savedFormData, setSavedFormData] = useState<FormState>(() =>
    termToFormState(term),
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
    setSuccess(false);

    const { error: updateError } = await updateTerm({
      id: term.id,
      academic_year: formData.academic_year,
      term_code: formData.term_code,
      sequence: parsedSequence,
      start: formData.start,
      end: formData.end,
    });

    setIsSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    const newSavedState = {
      academic_year: formData.academic_year.trim(),
      term_code: formData.term_code.trim(),
      sequence: String(parsedSequence),
      start: formData.start,
      end: formData.end,
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
          Edit Term
        </CardTitle>
        <div className="flex flex-row items-center gap-4">
          <Link href={`/academic-terms/${term.id}`} className="text-foreground">
            <X />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="overflow-y-auto h-full flex flex-col gap-6 py-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Calendar className="w-5 h-5" />
            <h3 className="font-semibold">Term Profile</h3>
          </div>

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <p className="text-xs text-green-900">
                Term updated successfully
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
                onChange={(event) => handleChange("start", event.target.value)}
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
