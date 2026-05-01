"use client";

import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/style";

export type AdminManagementListItem = {
  id: string;
  title: string;
  subtitle: string[];
  icon?: ReactNode;
  annotations?: ReactNode;
};

type AdminManagementListProps = {
  query: string;
  onQueryChange: (value: string) => void;
  selectedId: string | null;
  createLabel: string;
  searchPlaceholder: string;
  emptyMessage: string;
  items: AdminManagementListItem[];
  onCreate: () => void;
  onSelect: (id: string) => void;
};

export function AdminManagementList({
  query,
  onQueryChange,
  selectedId,
  createLabel,
  searchPlaceholder,
  emptyMessage,
  items,
  onCreate,
  onSelect,
}: AdminManagementListProps) {
  return (
    <div className="relative h-full flex-1 flex flex-col gap-4 overflow-hidden">
      <div className="w-full flex flex-row items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
        <Button type="button" onClick={onCreate} size="sm">
          <Plus className="h-4 w-4" />
          {createLabel}
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-4">
        <div className="space-y-1">
          {items.length === 0 ? (
            <div className="flex h-full min-h-48 items-center justify-center rounded-md border p-4 text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : null}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                "flex h-14 w-full flex-row items-center overflow-hidden rounded-lg border transition",
                "hover:border-foreground/30 hover:bg-foreground/5",
                selectedId === item.id && "border-foreground/40 bg-foreground/5",
              )}
            >
              <div className="flex min-h-14 min-w-14 items-center justify-center bg-foreground/80 text-background/80">
                <span className="flex h-5 w-5 items-center justify-center">
                  {item.icon}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-start px-4 py-2">
                <p className="line-clamp-1 text-left text-sm font-semibold">
                  {item.title}
                </p>
                <div className="flex flex-col text-left">
                  {item.subtitle.slice(0, 2).map((line, index) => (
                    <p
                      key={index}
                      className="line-clamp-1 text-xs text-muted-foreground"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
              {item.annotations ? (
                <div className="flex h-full shrink-0 flex-col items-end gap-1 p-2">
                  {item.annotations}
                </div>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
