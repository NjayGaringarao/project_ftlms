"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/style";

type InlineListItem = {
  id: string;
  title: string;
  description?: string;
  meta?: ReactNode;
};

type AdminInlineListSectionProps = {
  title: string;
  emptyMessage: string;
  items: InlineListItem[];
  onCreate?: () => void;
  onEdit?: (id: string) => void;
  createLabel?: string;
};

export function AdminInlineListSection({
  title,
  emptyMessage,
  items,
  onCreate,
  onEdit,
  createLabel = "Add",
}: AdminInlineListSectionProps) {
  return (
    <section className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {onCreate ? (
          <Button type="button" variant="outline" size="sm" onClick={onCreate}>
            {createLabel}
          </Button>
        ) : null}
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-foreground/70">
            {emptyMessage}
          </div>
        ) : null}
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left",
              "transition hover:bg-foreground/5 hover:border-foreground/30",
            )}
            onClick={() => onEdit?.(item.id)}
          >
            <span className="min-w-0">
              <span className="section truncate text-sm font-medium">
                {item.title}
              </span>
              {item.description ? (
                <span className="section truncate text-xs text-foreground/70">
                  {item.description}
                </span>
              ) : null}
            </span>
            {item.meta ? <span className="shrink-0">{item.meta}</span> : null}
          </button>
        ))}
      </div>
    </section>
  );
}
