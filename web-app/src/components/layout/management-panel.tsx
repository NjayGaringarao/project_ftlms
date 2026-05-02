"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils/style";
import { X } from "lucide-react";

type ManagementPanelProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  className?: string;
  bodyClassName?: string;
};

export function ManagementPanel({
  title,
  subtitle,
  children,
  footer,
  onClose,
  className,
  bodyClassName,
}: ManagementPanelProps) {
  return (
    <section className={cn("rounded-lg bg-card shadow-sm h-full", className)}>
      <header className="sticky top-0 z-10 border-b bg-card/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-card/80">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold">{title}</div>
            {subtitle ? (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex rounded-md p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </header>
      <div
        className={cn(
          "max-h-[calc(100vh-10rem)] overflow-y-auto px-4 py-4",
          bodyClassName,
        )}
      >
        {children}
      </div>
      {footer ? <footer className="border-t px-4 py-3">{footer}</footer> : null}
    </section>
  );
}
