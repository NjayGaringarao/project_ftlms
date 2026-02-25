"use client";

import { Plus } from "lucide-react";
import { cn } from "@/utils/style";

type AddTileProps = {
  title: string;
  description?: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
};

export const AddTile = ({
  title,
  description,
  onClick,
  disabled,
  className,
}: AddTileProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full rounded-md border border-dashed p-4 text-left transition-colors",
        "border-foreground/25 hover:border-foreground/40 hover:bg-foreground/5",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-md bg-foreground/10 p-1.5">
          <Plus className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          {description && (
            <p className="text-xs text-foreground/70">{description}</p>
          )}
        </div>
      </div>
    </button>
  );
};
