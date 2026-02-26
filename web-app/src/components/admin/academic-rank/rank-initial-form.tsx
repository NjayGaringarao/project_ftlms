"use client";

import { Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

type RankFormState = {
  number: string;
  title: string;
  description: string;
};

type RankInitialFormProps = {
  formData: RankFormState;
  onChange: (field: keyof RankFormState, value: string) => void;
  onReset: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  submitLabel: string;
  submitLoadingLabel: string;
  statusSlot?: ReactNode;
  extraFields?: ReactNode;
};

export const RankInitialForm = ({
  formData,
  onChange,
  onReset,
  onSubmit,
  isSaving,
  submitLabel,
  submitLoadingLabel,
  statusSlot,
  extraFields,
}: RankInitialFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Trophy className="w-5 h-5" />
          <h3 className="font-semibold">Rank Profile</h3>
        </div>

        {statusSlot}

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
              onChange={(event) => onChange("number", event.target.value)}
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
              onChange={(event) => onChange("title", event.target.value)}
              onBlur={(event) => onChange("title", event.target.value.trim())}
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
              onChange={(event) => onChange("description", event.target.value)}
              onBlur={(event) =>
                onChange("description", event.target.value.trim())
              }
              className="mt-1"
              disabled={isSaving}
            />
          </div>
        </div>
      </div>

      {extraFields}

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button variant="outline" onClick={onReset} disabled={isSaving}>
          Reset
        </Button>
        <Button onClick={onSubmit} disabled={isSaving}>
          {isSaving ? submitLoadingLabel : submitLabel}
        </Button>
      </div>
    </div>
  );
};

export type { RankFormState };
