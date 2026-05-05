"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CollegeFormState = {
  code: string;
  name: string;
  description: string;
};

type InitialFormProps = {
  formData: CollegeFormState;
  onChange: (field: keyof CollegeFormState, value: string) => void;
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

export const InitialForm = ({
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
}: InitialFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {statusSlot}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label className="text-xs" htmlFor="code">
              College Code *
            </Label>
            <Input
              id="code"
              placeholder="e.g. CCS"
              value={formData.code}
              onChange={(event) => onChange("code", event.target.value)}
              onBlur={(event) =>
                onChange("code", event.target.value.toUpperCase().trim())
              }
              className="mt-1"
              disabled={isSaving || isEditing}
            />
          </div>

          <div>
            <Label className="text-xs" htmlFor="name">
              College Name *
            </Label>
            <Input
              id="name"
              placeholder="e.g. College of Computer Studies"
              value={formData.name}
              onChange={(event) => onChange("name", event.target.value)}
              onBlur={(event) => onChange("name", event.target.value.trim())}
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
              placeholder="Enter college description"
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

export type { CollegeFormState };
