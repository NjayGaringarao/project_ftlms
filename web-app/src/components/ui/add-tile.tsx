"use client";

import { Plus } from "lucide-react";
import { cn } from "@/utils/style";

type AddTileProps = {
  title: string;
  description?: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  iconClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export const AddTile = ({
  title,
  description,
  onClick,
  disabled,
  className,
  containerClassName,
  iconClassName,
  titleClassName,
  descriptionClassName,
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
      <div className={cn("flex items-start gap-3", containerClassName)}>
        <div className="mt-0.5 rounded-md bg-foreground/10 p-1.5">
          <Plus className={cn("h-4 w-4", iconClassName)} />
        </div>
        <div>
          <p className={cn("text-sm font-semibold", titleClassName)}>{title}</p>
          {description && (
            <p
              className={cn("text-xs text-foreground/70", descriptionClassName)}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};
