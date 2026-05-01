"use client";

import { Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

type DepartmentFormState = {
  code: string;
  name: string;
  description: string;
};

type DepartmentInitialFormProps = {
  formData: DepartmentFormState;
  onChange: (field: keyof DepartmentFormState, value: string) => void;
  onReset: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  submitLabel: string;
  submitLoadingLabel: string;
  statusSlot?: ReactNode;
  extraFields?: ReactNode;
};

export const DepartmentInitialForm = ({
  formData,
  onChange,
  onReset,
  onSubmit,
  isSaving,
  submitLabel,
  submitLoadingLabel,
  statusSlot,
  extraFields,
}: DepartmentInitialFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Building2 className="w-5 h-5" />
          <h3 className="font-semibold">Department Profile</h3>
        </div>

        {statusSlot}

        <div className="flex flex-col gap-4">
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
              disabled={isSaving}
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
            <Input
              id="description"
              placeholder="Enter college description"
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

export type { DepartmentFormState };
