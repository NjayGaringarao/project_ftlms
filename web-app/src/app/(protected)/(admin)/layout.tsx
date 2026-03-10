import { PageHeader } from "@/components/ui/page-header";
import Image from "next/image";
import React from "react";

const UniversityLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative flex h-full flex-col">
      <PageHeader accessLabel="Administrator Access"/>
      <div className="p-4 flex-1 overflow-hidden">{children}</div>
      <div className="absolute  h-full w-full bg-background z-100 lg:hidden flex flex-col items-center justify-center px-16">
        <div className="flex flex-col gap-4 justify-center">
          <Image
            src="/images/display_small.png"
            alt="Home Banner"
            width={400}
            height={400}
            className="w-2/4 min-w-56"
          />
          <div className="flex flex-col max-w-56">
            <h1 className="text-4xl font-semibold">Small Screen</h1>
            <p className="text-xs text-start text-foreground/80">
              This page requires a larger display. Please resize your browser
              window or access it a device with a larger screen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversityLayout;
