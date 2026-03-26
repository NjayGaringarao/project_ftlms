import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCampusProposalAction } from "@/lib/faculty-load/actions";
import { getCampusProposalReviewBundle } from "@/lib/faculty-load/queries";
import { getCurrentUserData } from "@/lib/user-data/queries";
import CampusProposalSummary from "@/components/ftl-evaluation/shared/campus-proposal-summary";
import type { ProposalLifecycleStatus } from "@/models";

type CampusProposalControlWorkspaceProps = {
  academicTermId: string;
  campusId: string;
  campusCode: string;
  campusName: string;
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

const CampusProposalControlWorkspace = async ({
  academicTermId,
  campusId,
  campusCode,
  campusName,
}: CampusProposalControlWorkspaceProps) => {
  const [bundle, currentUserData] = await Promise.all([
    getCampusProposalReviewBundle(campusId, academicTermId),
    getCurrentUserData({ includeDesignations: true }),
  ]);

  const { campusProposal, members, evaluations, currentIndividualProposals } = bundle;
  const approvedIndividuals = currentIndividualProposals.filter(
    (item) => item.lifecycle_status === "APPROVED",
  ).length;
  const activeIndividuals = currentIndividualProposals.filter(
    (item) => item.lifecycle_status === "ACTIVE",
  ).length;

  const campusDirectorDesignation = (currentUserData?.designations ?? []).find(
    (designation) =>
      designation.job_title === "Campus Director" &&
      designation.campus_id === campusId,
  );

  const canCreateCampusProposal =
    !!campusDirectorDesignation &&
    approvedIndividuals > 0 &&
    activeIndividuals === 0;

  return (
    <div className="grid h-full min-h-0 gap-4 p-4 lg:grid-cols-5">
      <div className="min-h-0 lg:col-span-3">
        <CampusProposalSummary
          academicTermId={academicTermId}
          campusCode={campusCode}
          campusName={campusName}
          campusProposal={campusProposal}
          members={members}
          evaluations={evaluations}
        />
      </div>

      <Card className="h-fit lg:col-span-2">
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

          {!campusDirectorDesignation && (
            <p className="text-xs text-foreground/60">
              Campus Director designation is required for this campus to create a
              campus proposal.
            </p>
          )}

          {campusDirectorDesignation && !canCreateCampusProposal && (
            <p className="text-xs text-foreground/60">
              Requires at least one approved individual proposal and zero active
              pending proposals.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CampusProposalControlWorkspace;
