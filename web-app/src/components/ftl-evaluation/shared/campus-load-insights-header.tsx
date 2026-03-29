import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";

export type CampusLoadInsightsFilterMode = "APPROVED" | "ALL";

type CampusLoadInsightsHeaderProps = {
  campusName: string;
  campusCode: string;
  academicTermCode: string;
  filterMode: CampusLoadInsightsFilterMode;
  approvedCount: number;
  allCount: number;
  onFilterModeChange: (mode: CampusLoadInsightsFilterMode) => void;
  exportActions?: ReactNode;
};

const CampusLoadInsightsHeader = ({
  campusName,
  campusCode,
  academicTermCode,
  filterMode,
  approvedCount,
  allCount,
  onFilterModeChange,
  exportActions,
}: CampusLoadInsightsHeaderProps) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between gap-4">
      <div className="flex flex-row items-center gap-2">
        <CardTitle className="text-base">Campus Load Insights</CardTitle>
        <p className="text-sm text-foreground/80">
          ({campusName} ({campusCode}) - {academicTermCode})
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm">
        {exportActions}
        <Button
          type="button"
          size="sm"
          variant={filterMode === "APPROVED" ? "default" : "outline"}
          onClick={() => onFilterModeChange("APPROVED")}
        >
          Approved Proposals ({approvedCount})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filterMode === "ALL" ? "default" : "outline"}
          onClick={() => onFilterModeChange("ALL")}
        >
          All Proposals ({allCount})
        </Button>
      </div>
    </CardHeader>
  );
};

export default CampusLoadInsightsHeader;
