import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCampusProposalAction } from "@/lib/proposal/actions";
import type { CampusProposal, ProposalLifecycleStatus } from "@/models";

type CampusProposalControlActionPanelProps = {
  academicTermId: string;
  campusId: string;
  campusCode: string;
  campusName: string;
  campusProposal: CampusProposal | null;
  approvedIndividuals: number;
  activeIndividuals: number;
  hasCampusDirectorDesignation: boolean;
};

const lifecycleLabel: Record<ProposalLifecycleStatus, string> = {
  ACTIVE: "Active",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  INVALIDATED: "Invalidated",
};

const lifecycleStyle: Record<ProposalLifecycleStatus, string> = {
  ACTIVE: "bg-amber-100 text-amber-800 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
  INVALIDATED: "bg-slate-100 text-slate-800 border-slate-200",
};

const CampusProposalControlActionPanel = ({
  academicTermId,
  campusId,
  campusCode,
  campusName,
  campusProposal,
  approvedIndividuals,
  activeIndividuals,
  hasCampusDirectorDesignation,
}: CampusProposalControlActionPanelProps) => {
  const canCreateCampusProposal =
    hasCampusDirectorDesignation &&
    approvedIndividuals > 0 &&
    activeIndividuals === 0;

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-base">Campus Proposal Control</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>
          Current campus:{" "}
          <b>
            {campusName} ({campusCode})
          </b>
        </p>

        <div className="rounded-md border p-3 space-y-1">
          <p>Approved Individuals: {approvedIndividuals}</p>
          <p>Active Individuals: {activeIndividuals}</p>
          <p>
            Current Campus Proposal:{" "}
            {campusProposal ? (
              <span
                className={`rounded border px-1.5 py-0.5 text-xs ${lifecycleStyle[campusProposal.lifecycle_status]}`}
              >
                {lifecycleLabel[campusProposal.lifecycle_status]}
              </span>
            ) : (
              "None"
            )}
          </p>
        </div>

        <form action={createCampusProposalAction}>
          <input type="hidden" name="academicTermId" value={academicTermId} />
          <input type="hidden" name="campusId" value={campusId} />
          <Button size="sm" disabled={!canCreateCampusProposal}>
            Create / Recreate Campus Proposal
          </Button>
        </form>

        {!hasCampusDirectorDesignation && (
          <p className="text-xs text-foreground/60">
            Campus Director designation is required for this campus to create a
            campus proposal.
          </p>
        )}

        {hasCampusDirectorDesignation && !canCreateCampusProposal && (
          <p className="text-xs text-foreground/60">
            Requires at least one approved individual proposal and zero active
            pending proposals.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CampusProposalControlActionPanel;
