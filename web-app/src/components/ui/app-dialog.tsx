"use client";

import type { ReactNode } from "react";
import { Dialog } from "radix-ui";
import { cn } from "@/utils/style";
import { ArrowLeft, X } from "lucide-react";

export type AppDialogVariant =
  | "full-screen"
  | "floating-large"
  | "floating-medium"
  | "floating-small";

type AppDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  variant?: AppDialogVariant;
  contentClassName?: string;
};

export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  variant = "floating-small",
  contentClassName,
}: AppDialogProps) {
  const contentModeClassName =
    variant === "full-screen"
      ? "fixed inset-0 z-50 w-screen h-screen rounded-none border-0 bg-background shadow-none"
      : variant === "floating-large"
        ? "fixed left-1/2 top-1/2 z-50 h-auto max-h-[95vh] w-[95vw] max-w-6xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border bg-background shadow-lg"
        : variant === "floating-medium"
          ? "fixed left-1/2 top-1/2 z-50 h-auto max-h-[95vh] w-[95vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border bg-background shadow-lg"
          : "fixed left-1/2 top-1/2 z-50 h-auto max-h-[95vh] w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border bg-background shadow-lg";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className={cn("flex flex-col", contentModeClassName)}>
          <div className="flex items-center justify-between gap-4 p-4 bg-foreground/5">
            {variant === "full-screen" && (
              <Dialog.Close
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                aria-label="Close"
              >
                <ArrowLeft className="h-4 w-4" />
              </Dialog.Close>
            )}

            <div className="flex-1">
              <Dialog.Title className="text-base font-semibold">
                {title}
              </Dialog.Title>
              
              {description ? (
                <Dialog.Description className="text-xs text-muted-foreground">
                  {description}
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">
                  Dialog content and actions.
                </Dialog.Description>
              )}
            </div>

            {variant !== "full-screen" && (
              <Dialog.Close
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Dialog.Close>
            )}
          </div>
          <div
            className={cn("flex-1", "overflow-y-auto", contentClassName)}
          >
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
