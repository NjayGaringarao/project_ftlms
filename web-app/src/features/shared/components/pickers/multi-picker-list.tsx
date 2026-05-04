"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Check, CheckSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";

type MultiPickerListProps<T> = {
  items: T[];
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  getSubtitle?: (item: T) => string[];
  getSearchText?: (item: T) => string;
  getAnnotation?: (item: T) => ReactNode;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  placeholder?: string;
  title?: string;
  headerSlot?: ReactNode;
  icon?: ReactNode;
  emptyState?: string;
};

export function MultiPickerList<T>({
  items,
  getId,
  getTitle,
  getSubtitle,
  getSearchText,
  getAnnotation,
  selectedIds,
  onToggle,
  placeholder = "Search...",
  title,
  headerSlot,
  icon,
  emptyState = "No results.",
}: MultiPickerListProps<T>) {
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;

    return items.filter((item) => {
      const searchable =
        getSearchText?.(item) ??
        [getTitle(item), ...(getSubtitle?.(item) ?? [])].join(" ");

      return searchable.toLowerCase().includes(normalized);
    });
  }, [getSearchText, getSubtitle, getTitle, items, query]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      {title || headerSlot ? (
        <div className="space-y-2">
          {title ? <h3 className="text-sm font-semibold">{title}</h3> : null}
          {headerSlot}
        </div>
      ) : null}

      <Input
        placeholder={placeholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className="min-h-0 flex-1 grid grid-cols-2 gap-2 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <p className="p-4 text-center text-sm text-foreground/70">
            {emptyState}
          </p>
        ) : null}

        {filteredItems.map((item) => {
          const id = getId(item);
          const isSelected = selectedIds.has(id);

          return (
            <ListItemSmall
              key={id}
              title={getTitle(item)}
              subtitle={getSubtitle?.(item) ?? []}
              isSelected={isSelected}
              onClick={() => onToggle(id)}
              icon={
                isSelected ? (
                  <CheckSquare className="h-5 w-5 text-background/80" />
                ) : (
                  icon
                )
              }
              annotations={getAnnotation?.(item)}
              indicator={null}
              listType="modal"
            />
          );
        })}
      </div>
    </div>
  );
}
