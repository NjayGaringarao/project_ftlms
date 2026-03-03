"use client";

import { ReactNode } from "react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive" | "outline" | "secondary";
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
};

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "default",
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) => {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      contentClassName="w-full max-w-md"
    >
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {cancelLabel}
        </Button>
        <Button
          variant={confirmVariant}
          onClick={() => void onConfirm()}
          disabled={isLoading}
        >
          {confirmLabel}
        </Button>
      </div>
    </AppDialog>
  );
};
