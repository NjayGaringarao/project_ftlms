"use client";

import Image from "next/image";
import useDarkMode from "@/features/shared/hooks/useDarkMode";
import { cn } from "@/utils/style";

interface ILogo {
  className?: string;
}

export function Logo({ className }: ILogo) {
  const isDarkMode = useDarkMode();
  return (
    <Image
      src={isDarkMode ? "/logo_dark.png" : "/logo_light.png"}
      alt="Logo"
      width={512}
      height={512}
      className={cn("items-center w-80", className)}
    />
  );
}
