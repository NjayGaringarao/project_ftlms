"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

type RankFormState = {
  code: string;
  title: string;
  description: string;
};

type RankInitialFormProps = {
  formData: RankFormState;
  onChange: (field: keyof RankFormState, value: string) => void;
  onReset: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  isEditing?: boolean;
  submitLabel: string;
  submitLoadingLabel: string;
  statusSlot?: ReactNode;
  extraFields?: ReactNode;
  showActions?: boolean;
};

export const RankInitialForm = ({
  formData,
  onChange,
  onReset,
  onSubmit,
  isSaving,
  isEditing = false,
  submitLabel,
  submitLoadingLabel,
  statusSlot,
  extraFields,
  showActions = true,
}: RankInitialFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {statusSlot}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs" htmlFor="code">
              Rank Code *
            </Label>
            <Input
              id="code"
              placeholder="e.g. PROF-1"
              value={formData.code}
              onChange={(event) => onChange("code", event.target.value)}
              onBlur={(event) =>
                onChange("code", event.target.value.trim().toUpperCase())
              }
              className="mt-1"
              disabled={isSaving || isEditing}
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
            <textarea
              id="description"
              placeholder="Enter rank description"
              value={formData.description}
              onChange={(event) => onChange("description", event.target.value)}
              onBlur={(event) =>
                onChange("description", event.target.value.trim())
              }
              className="mt-1 min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
            />
          </div>
        </div>
      </div>

      {extraFields}

      {showActions ? (
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onReset} disabled={isSaving}>
            Reset
          </Button>
          <Button onClick={onSubmit} disabled={isSaving}>
            {isSaving ? submitLoadingLabel : submitLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export type { RankFormState };
