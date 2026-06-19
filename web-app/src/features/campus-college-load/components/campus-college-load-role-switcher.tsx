"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const CampusCollegeLoadRoleSwitcher = ({
  view,
}: {
  view: "chair" | "evaluator";
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const switchTo = (nextView: "chair" | "evaluator") => {
    if (nextView === view) return;
    const next = new URLSearchParams();
    next.set("view", nextView);
    const academicTermId = searchParams.get("academic_term_id");
    if (academicTermId) next.set("academic_term_id", academicTermId);
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="flex items-center gap-1 rounded-md border p-1" role="tablist">
      <Button
        type="button"
        size="sm"
        variant={view === "chair" ? "default" : "ghost"}
        onClick={() => switchTo("chair")}
      >
        Program Chair view
      </Button>
      <Button
        type="button"
        size="sm"
        variant={view === "evaluator" ? "default" : "ghost"}
        onClick={() => switchTo("evaluator")}
      >
        Evaluator view
      </Button>
    </div>
  );
};

export default CampusCollegeLoadRoleSwitcher;
