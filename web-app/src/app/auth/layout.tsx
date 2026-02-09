import React from "react";
import Image from "next/image";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/utils/style";
const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-screen w-full flex flex-row overflow-hidden">
      <Image
        src="/prmsu_backdrop.png"
        alt="Logo"
        width={2048}
        height={2048}
        className="absolute h-screen w-full object-cover object-center"
      />
      <div
        className={cn(
          "relative w-full md:max-w-lg",
          "flex flex-col justify-center",
          "bg-background/85 backdrop-blur-sm p-6",
        )}
      >
        <div className="flex flex-row gap-4 items-end">
          <Logo className="w-40 md:w-40" />
          <div className="text-3xl text-foreground">
            <h1>FACULTY TEACHING LOAD MANAGEMENT SYSTEM</h1>
          </div>
        </div>
        <div className="border-y border-foreground/20 mt-6 overflow-auto">
          {children}
        </div>
      </div>
      <div className="relative flex-1 flex-col justify-between md:flex hidden ">
        <div className="absolute z-10 w-full h-screen bg-background/50 backdrop-blur-xs"></div>
        <div className="z-20 flex-1 flex flex-col items-center justify-center p-6 md:p-10">
          <Image
            src="/prmsu.png"
            alt="Logo"
            width={2048}
            height={2048}
            className="w-1/2 min-w-60"
          />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
