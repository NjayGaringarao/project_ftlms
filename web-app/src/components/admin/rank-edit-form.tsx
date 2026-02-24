"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, CheckCircle, Save, Trophy, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Rank } from "@/models/rank";
import { updateRank } from "@/lib/admin/actions";

type RankEditFormProps = {
  rank: Rank;
};

type FormState = {
  number: string;
  title: string;
  description: string;
};

const rankToFormState = (rank: Rank): FormState => ({
  number: rank.number.toString(),
  title: rank.title,
  description: rank.description ?? "",
});

export const RankEditForm = ({ rank }: RankEditFormProps) => {
  const [formData, setFormData] = useState<FormState>(() =>
    rankToFormState(rank),
  );
  const [savedFormData, setSavedFormData] = useState<FormState>(() =>
    rankToFormState(rank),
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
    setSuccess(false);

    const { error: updateError } = await updateRank({
      id: rank.id,
      number: parsedNumber,
      title: formData.title,
      description: formData.description,
    });

    setIsSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    const newSavedState = {
      number: parsedNumber.toString(),
      title: formData.title.trim(),
      description: formData.description.trim(),
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
          Edit Rank
        </CardTitle>
        <div className="flex flex-row items-center gap-4">
          <Link href={`/academic-ranks/${rank.id}`} className="text-foreground">
            <X />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="overflow-y-auto h-full flex flex-col gap-6 py-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Trophy className="w-5 h-5" />
            <h3 className="font-semibold">Rank Profile</h3>
          </div>

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <p className="text-xs text-green-900">
                Rank updated successfully
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
              <Label className="text-xs" htmlFor="number">
                Rank Number *
              </Label>
              <Input
                id="number"
                type="number"
                placeholder="e.g. 1"
                value={formData.number}
                onChange={(event) => handleChange("number", event.target.value)}
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
                onChange={(event) => handleChange("title", event.target.value)}
                className="mt-1"
                disabled={isSaving}
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
