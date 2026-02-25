"use client";

import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";
import { AcademicTermOrder, AcademicTermType } from "@/models";
import {
  ACADEMIC_TERM_TYPES,
  TERM_ORDERS_BY_TYPE,
  getTermOrderLabel,
  getTermTypeLabel,
} from "@/lib/admin/academic-terms";

type TermFormState = {
  academic_year_start: string;
  academic_year_end: string;
  type: AcademicTermType;
  term_order: AcademicTermOrder;
  start: string;
  end: string;
};

type TermInitialFormProps = {
  formData: TermFormState;
  onChange: (field: keyof TermFormState, value: string) => void;
  onReset: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  submitLabel: string;
  submitLoadingLabel: string;
  generatedCode: string;
  statusSlot?: ReactNode;
  extraFields?: ReactNode;
};

export const TermInitialForm = ({
  formData,
  onChange,
  onReset,
  onSubmit,
  isSaving,
  submitLabel,
  submitLoadingLabel,
  generatedCode,
  statusSlot,
  extraFields,
}: TermInitialFormProps) => {
  const validTermOrders = TERM_ORDERS_BY_TYPE[formData.type];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Calendar className="w-5 h-5" />
          <h3 className="font-semibold">Term Profile</h3>
        </div>

        {statusSlot}

        <div className="flex flex-col gap-4">
          <div>
            <Label className="text-xs" htmlFor="academic_year_start">
              Academic Year Start *
            </Label>
            <Input
              id="academic_year_start"
              type="number"
              placeholder="e.g. 2025"
              value={formData.academic_year_start}
              onChange={(event) =>
                onChange("academic_year_start", event.target.value)
              }
              onBlur={(event) =>
                onChange("academic_year_start", event.target.value.trim())
              }
              className="mt-1"
              disabled={isSaving}
            />
          </div>

          <div>
            <Label className="text-xs" htmlFor="academic_year_end">
              Academic Year End *
            </Label>
            <Input
              id="academic_year_end"
              type="number"
              placeholder="e.g. 2026"
              value={formData.academic_year_end}
              onChange={(event) =>
                onChange("academic_year_end", event.target.value)
              }
              onBlur={(event) =>
                onChange("academic_year_end", event.target.value.trim())
              }
              className="mt-1"
              disabled={isSaving}
            />
          </div>

          <div>
            <Label className="text-xs" htmlFor="term-type">
              Term Type *
            </Label>
            <select
              id="term-type"
              className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
              value={formData.type}
              onChange={(event) =>
                onChange("type", event.target.value as AcademicTermType)
              }
              disabled={isSaving}
            >
              {ACADEMIC_TERM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {getTermTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs" htmlFor="term-order">
              Term Order *
            </Label>
            <select
              id="term-order"
              className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
              value={formData.term_order}
              onChange={(event) =>
                onChange("term_order", event.target.value as AcademicTermOrder)
              }
              disabled={isSaving}
            >
              {validTermOrders.map((termOrder) => (
                <option key={termOrder} value={termOrder}>
                  {getTermOrderLabel(termOrder)}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <Label className="text-xs" htmlFor="term-code">
              Generated Code
            </Label>
            <Input
              id="term-code"
              value={generatedCode}
              readOnly
              className="mt-1"
              disabled
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
              onChange={(event) => onChange("start", event.target.value)}
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
              onChange={(event) => onChange("end", event.target.value)}
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

export type { TermFormState };
