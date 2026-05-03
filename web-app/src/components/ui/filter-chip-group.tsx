"use client";

import { cn } from "@/utils/style";
import { Funnel } from "lucide-react";

type FilterChipOption<T extends string> = {
  label: string;
  value: T;
  count?: number;
};

type FilterChipGroupProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: FilterChipOption<T>[];
  className?: string;
  noIcon?: boolean;
};

export function FilterChipGroup<T extends string>({
  value,
  onChange,
  options,
  className,
  noIcon = false,
}: FilterChipGroupProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-1 items-center", className)}>
      {!noIcon && <Funnel className="h-5 w-5 text-foreground/80 mr-2" />}

      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "text-[10px] px-2 py-0.5 border border-foreground/20 rounded-xs",
              active ? "bg-foreground/80 text-background" : "bg-background text-foreground",
            )}
          >
            {option.label}
            {typeof option.count === "number" ? ` (${option.count})` : ""}
          </button>
        );
      })}
    </div>
  );
}
