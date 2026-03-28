"use client";

import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";

type RejectionDialogHiddenField = {
  name: string;
  value: string;
};

type RejectionCommentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields: RejectionDialogHiddenField[];
  commentPlaceholder?: string;
  isCommentRequired?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
};

const RejectionCommentDialog = ({
  open,
  onOpenChange,
  title,
  description,
  action,
  hiddenFields,
  commentPlaceholder = "Enter rejection comment",
  isCommentRequired = true,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}: RejectionCommentDialogProps) => {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      contentClassName="w-full max-w-md"
    >
      <form action={action} className="space-y-3">
        {hiddenFields.map((field) => (
          <input
            key={field.name}
            type="hidden"
            name={field.name}
            value={field.value}
          />
        ))}
        <textarea
          name="comment"
          required={isCommentRequired}
          placeholder={commentPlaceholder}
          className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button type="submit" variant="destructive">
            {confirmLabel}
          </Button>
        </div>
      </form>
    </AppDialog>
  );
};

export default RejectionCommentDialog;
