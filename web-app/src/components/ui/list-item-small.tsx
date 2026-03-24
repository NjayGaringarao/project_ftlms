"use client";

import { cn } from "@/utils/style";
import { ArrowRight, Dot } from "lucide-react";
import React from "react";

type ListItemSmallProps = {
  key: string;
  title: string;
  subtitle: string[] | React.ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
  icon?: React.ReactNode;
  annotations?: React.ReactNode;
  className?: string;
  listType?: "layout" | "modal";
};

const ListItemSmall = ({
  title,
  subtitle,
  onClick,
  isSelected,
  icon,
  annotations,
  className,
  listType = "layout",
}: ListItemSmallProps) => {
  const isSubtitleArray = Array.isArray(subtitle);
  const isSubtitleAnElement = React.isValidElement(subtitle);

  return (
    <div
      className={cn(
        "flex flex-row rounded-lg border transition items-center",
        "min-h-14 overflow-hidden",
        "hover:bg-foreground/5 hover:border-foreground/30 ",
        isSelected && "bg-foreground/10 border-foreground/40 font-semibold",
        className
      )}
    >
      <button onClick={onClick} className="flex-1 flex flex-row items-center">

      <div
        className={cn(
          "h-full min-h-14 min-w-14 bg-foreground/80 ",
          "flex items-center justify-center",
        )}
      >
        {icon && icon}
      </div>

      <div className="flex-1 flex flex-col items-start px-4 ">
        {/* Title and annotations row */}

        <p className="flex-1 text-base font-semibold text-start line-clamp-1">
          {title}
        </p>

        {/* Subtitle rows */}
        {isSubtitleArray && (
          <div className="flex-1 flex flex-col text-start">
            {subtitle.map((item, index) => (
              <p
                key={index}
                className="text-xs text-foreground/70 line-clamp-1"
              >
                {item}
              </p>
            ))}
          </div>
        )}
        {isSubtitleAnElement && subtitle}
      </div>
      </button>
      <div className="h-full flex flex-col items-center p-2">
        {annotations && annotations}
        {isSelected && (
          
            listType === "layout" ? (
              <ArrowRight className="h-6 w-6 text-foreground/70" />
            ) : (<div className="h-3 w-3 bg-foreground/50 mt-1 rounded-full" />)
          
        )}
      </div>
    </div>
  );
};

export default ListItemSmall;
