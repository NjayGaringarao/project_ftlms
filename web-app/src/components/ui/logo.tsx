"use client";

import Image from "next/image";
import { cn } from "@/utils/style";

interface ILogo {
  className?: string;
}

export function Logo({ className }: ILogo) {
  return (
    <Image
      src={"/prmsu.png"}
      alt="Logo"
      width={512}
      height={512}
      className={cn("items-center w-80", className)}
    />
  );
}
