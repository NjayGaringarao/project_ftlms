"use client";

import {
  Ban,
  CheckCircle2,
  CircleHelp,
  Clock3,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { ProposalStatusFilter } from "@/lib/proposal/types";
import { cn } from "@/utils/style";

type ProposalStatusFilterChipsProps = {
  activeStatus: ProposalStatusFilter;
  counts: Record<ProposalStatusFilter, number>;
  onChange: (status: ProposalStatusFilter) => void;
  className?: string;
};

const chipConfig: Array<{
  status: ProposalStatusFilter;
  label: string;
  Icon: LucideIcon;
}> = [
  { status: "PENDING", label: "Pending", Icon: Clock3 },
  { status: "APPROVED", label: "Approved", Icon: CheckCircle2 },
  { status: "REJECTED", label: "Rejected", Icon: XCircle },
  { status: "INVALIDATED", label: "Invalidated", Icon: Ban },
  { status: "NO_PROPOSAL", label: "No proposal", Icon: CircleHelp },
];

export const ProposalStatusFilterChips = ({
  activeStatus,
  counts,
  onChange,
  className,
}: ProposalStatusFilterChipsProps) => {
  return (
    <div
      className={cn(
        "grid shrink-0 grid-cols-5 overflow-hidden rounded-md border bg-background",
        className,
      )}
    >
      {chipConfig.map(({ status, label, Icon }) => {
        const isActive = activeStatus === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            aria-label={`${label}: ${counts[status]}`}
            title={`${label}: ${counts[status]}`}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-1 text-xs transition-colors",
              isActive
                ? "border-foreground bg-foreground/10 text-foreground"
                : "text-foreground/70 hover:bg-foreground/5",
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{counts[status]}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ProposalStatusFilterChips;
