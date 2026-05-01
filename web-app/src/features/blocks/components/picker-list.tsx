"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/utils/style";

type PickerListProps<T> = {
  items: T[];
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  getSubLabel?: (item: T) => string;
  getAnnotation?: (item: T) => React.ReactNode;
  selected: Set<string>;
  onToggle: (id: string) => void;
  placeholder?: string;
  pickerComponents?: React.ReactNode;
  title: string;
};

export function PickerList<T>({
  items,
  getId,
  getLabel,
  getSubLabel,
  getAnnotation,
  selected,
  onToggle,
  placeholder = "Search...",
  pickerComponents,
  title,
}: PickerListProps<T>) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => getLabel(item).toLowerCase().includes(q));
  }, [items, query, getLabel]);

  return (
    <Card className="h-full gap-0 overflow-hidden px-4 py-2">
      <CardHeader className="px-0 py-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="shrink-0 text-sm"
      />

      {pickerComponents}
      <CardContent className="flex flex-1 flex-col overflow-y-auto p-0">
        {filtered.length === 0 && (
          <p className="py-3 text-center text-sm text-foreground/60">
            No results.
          </p>
        )}
        {filtered.map((item) => {
          const id = getId(item);
          const isSelected = selected.has(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              className={cn(
                "flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition",
                "hover:bg-foreground/5",
                isSelected && "bg-foreground/10 font-semibold",
              )}
            >
              <div
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  isSelected
                    ? "border-foreground bg-foreground text-background"
                    : "border-foreground/30",
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate">{getLabel(item)}</p>
                {getSubLabel && (
                  <p className="truncate text-xs text-foreground/60">
                    {getSubLabel(item)}
                  </p>
                )}
              </div>
              {getAnnotation && (
                <div className="shrink-0">{getAnnotation(item)}</div>
              )}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
