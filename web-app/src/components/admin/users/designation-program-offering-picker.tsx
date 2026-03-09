"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppDialog } from "@/components/ui/app-dialog";
import { ProgramCampusOffering } from "@/lib/admin/programs";

type DesignationProgramOfferingPickerProps = {
  offerings: ProgramCampusOffering[];
  value: string;
  onChange: (offeringId: string) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
};

const normalizeText = (value: string): string => value.trim().toLowerCase();

const getOfferingDisplayLabel = (offering: ProgramCampusOffering): string =>
  `${offering.campus.name} - ${offering.program.name}`;

const DesignationProgramOfferingPicker = ({
  offerings,
  value,
  onChange,
  disabled = false,
  label = "Program Offering",
  placeholder = "Select program offering",
}: DesignationProgramOfferingPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedOffering = offerings.find((offering) => offering.id === value);

  const filteredOfferings = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      return offerings;
    }

    return offerings.filter((offering) => {
      const campus = normalizeText(offering.campus.name);
      const program = normalizeText(offering.program.name);
      return (
        campus.includes(normalizedQuery) || program.includes(normalizedQuery)
      );
    });
  }, [offerings, query]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium">{label}</p>
        {selectedOffering && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-1 text-xs"
            onClick={() => onChange("")}
          >
            Clear
          </Button>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full justify-start"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
      >
        {selectedOffering
          ? getOfferingDisplayLabel(selectedOffering)
          : placeholder}
      </Button>

      <AppDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Select Program Offering"
        description="Search by campus or program name."
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/60" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search campus or program"
              className="pl-8"
            />
          </div>

          <div className="max-h-72 overflow-y-auto rounded-md border border-foreground/20">
            {filteredOfferings.length === 0 && (
              <p className="p-3 text-xs text-foreground/70">
                No program offerings available for selection.
              </p>
            )}

            {filteredOfferings.map((offering) => {
              const isSelected = offering.id === value;

              return (
                <button
                  key={offering.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 border-b border-foreground/10 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-foreground/5"
                  onClick={() => {
                    onChange(offering.id);
                    setIsOpen(false);
                  }}
                >
                  <span>{getOfferingDisplayLabel(offering)}</span>
                  {isSelected && <Check className="h-4 w-4 text-emerald-600" />}
                </button>
              );
            })}
          </div>
        </div>
      </AppDialog>
    </div>
  );
};

export default DesignationProgramOfferingPicker;
