"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";

import { Suspense } from "react";
import Loading from "@/components/ui/loading";
import { Logo } from "@/components/ui/logo";

export default function ErrorPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ErrorPageContent />
    </Suspense>
  );
}

function ErrorPageContent() {
  const searchParams = useSearchParams();

  const title = searchParams.get("title") || "Oops! Something went wrong.";
  const subtitle =
    searchParams.get("subtitle") ||
    "We encountered an unexpected error. Please try again later or contact support if the problem persists.";

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-background relative overflow-hidden p-6">
      <Image
        src="/prmsu_backdrop.png"
        alt="PRMSU Backdrop"
        fill
        className="object-cover opacity-50 dark:opacity-20"
        priority
      />
      <div className="bg-background/40 dark:bg-background/50 backdrop-blur-md max-w-[50rem] w-full mx-8 md:mx-0 rounded-xl p-8 flex flex-col items-center">
        <div className="flex flex-row justify-center items-center gap-2">
          <Logo className="w-16" />
        </div>
        <div className="py-12 my-6 border-y border-textBody">
          <h2 className="text-3xl md:text-5xl font-semibold text-primary text-destructive text-start md:text-center mb-2">
            {title}
          </h2>
          <p className="text-textBody text-start md:text-center">{subtitle}</p>
        </div>
        <div className="flex flex-row gap-4 items-center">
          <div className="flex flex-row gap-4">
            <Image
              src="/prmsu.png"
              alt="PRMSU Logo"
              width={64}
              height={64}
              className="w-16 object-contain"
            />
            <Image
              src="/icto.jpg"
              alt="ICTO Logo"
              width={64}
              height={64}
              className="w-16 object-contain"
            />
          </div>
          <p className="flex-1 text-xs text-textBody text-start">
            Scheduler and Faculty Teaching Load Management System &copy; 2026 -
            ICTO
          </p>
        </div>
      </div>
    </div>
  );
}
