"use client";

import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type ResourceSectionProps = {
  title: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export function ResourceSection({
  title,
  count,
  isOpen,
  onToggle,
  children,
}: ResourceSectionProps) {
  const Caret = isOpen ? ChevronUp : ChevronDown;

  return (
    <section className="overflow-hidden rounded-md border bg-background">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-foreground/5"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold">{title}</span>
          <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs text-foreground/70">
            {count}
          </span>
        </span>
        <Caret className="h-4 w-4 shrink-0 text-foreground/60" />
      </button>
      {isOpen ? (
        <div className="border-t p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {children}
          </div>
        </div>
      ) : null}
    </section>
  );
}
