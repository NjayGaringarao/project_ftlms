"use client";

import { cn } from "@/utils/style";
import { ChevronRight } from "lucide-react";
import React from "react";

type ListItemProps = {
  key: string;
  title: string;
  subtitle: string[] | React.ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
  icon?: React.ReactNode;
  annotations?: React.ReactNode;
};

const ListItem = ({
  title,
  subtitle,
  onClick,
  isSelected,
  icon,
  annotations,
}: ListItemProps) => {
  const isSubtitleArray = Array.isArray(subtitle);
  const isSubtitleAnElement = React.isValidElement(subtitle);

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-row rounded-lg border transition items-center",
        "overflow-hidden",
        "hover:bg-foreground/5 hover:border-foreground/30 ",
        isSelected && "bg-foreground/10 border-foreground/40 font-semibold",
      )}
    >
      <div
        className={cn(
          "h-20 w-20 bg-foreground/80 ",
          "flex items-center justify-center",
        )}
      >
        {icon && icon}
      </div>

      <div className="flex-1 flex flex-col items-start px-4">
        {/* Title and annotations row */}
        <div className="flex flex-row items-center justify-between gap-3">
          <p className="text-base font-semibold text-start line-clamp-1">
            {title}
          </p>
          {annotations && annotations}
        </div>

        {/* Subtitle rows */}
        {isSubtitleArray && (
          <div className="flex-1 flex flex-col gap-1 text-start">
            {subtitle.map((item, index) => (
              <p
                key={index}
                className="text-sm text-foreground/70 line-clamp-1"
              >
                {item}
              </p>
            ))}
          </div>
        )}
        {isSubtitleAnElement && subtitle}
      </div>

      {isSelected && <ChevronRight className="h-10 w-10 text-foreground/70" />}
    </button>
  );
};

export default ListItem;
