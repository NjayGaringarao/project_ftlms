import { PageHeader } from "@/features/app-shell/components/page-header";
import SmallDisplayOverlay from "@/components/ui/small-display-overlay";
import Image from "next/image";
import React from "react";

const UniversityLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative flex h-full flex-col">
      <PageHeader accessLabel="Administrator Access"/>
      <div className="p-4 flex-1 overflow-hidden">{children}</div>
      <div className="absolute  h-full w-full bg-background z-100 lg:hidden flex flex-col items-center justify-center px-16">
       <SmallDisplayOverlay />
      </div>
    </div>
  );
};

export default UniversityLayout;
