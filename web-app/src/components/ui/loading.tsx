"use client";

import { cn } from "@/utils/style";
import React, { useState } from "react";

type LoadingSize = "small" | "medium" | "large" | "extralarge";

interface LoadingProps {
  size?: LoadingSize;
  prompt?: string;
  classname?: string;
}

const sizeMap: Record<LoadingSize, number> = {
  small: 24,
  medium: 40,
  large: 64,
  extralarge: 96,
};

// Reading primary colors at runtime from global.css
const getPrimaryColor = () => {
  if (typeof window !== "undefined") {
    const root = window.getComputedStyle(document.documentElement);
    return root.getPropertyValue("--color-primary").trim() || "#0000";
  }
  return "#0000";
};

export const Loading: React.FC<LoadingProps> = ({
  size = "medium",
  prompt,
  classname,
}) => {
  const spinnerSize = sizeMap[size];
  const [primaryColor] = useState(getPrimaryColor);

  return (
    <div className={cn("flex flex-col items-center gap-3", classname)}>
      <svg
        width={spinnerSize}
        height={spinnerSize}
        viewBox="0 0 50 50"
        className="block"
        aria-label="Loading"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={primaryColor}
          strokeWidth="5"
          strokeDasharray="90"
          strokeDashoffset="60"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 25 25"
            to="360 25 25"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      {prompt && (
        <span
          className={`text-primary font-medium ${
            size == "small"
              ? "text-lg"
              : size == "medium"
                ? "text-xl"
                : size == "large"
                  ? "text-2xl"
                  : size == "extralarge" && "text-3xl"
          } text-center`}
          style={{ color: primaryColor }}
        >
          {prompt}
        </span>
      )}
    </div>
  );
};

export default Loading;
