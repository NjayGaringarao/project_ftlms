import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
  createProposalAction,
  submitEvaluationAction,
} from "@/lib/faculty-load/actions";
import {
  getEvaluationsByProposal,
  getLatestProposalByUserTerm,
} from "@/lib/faculty-load/queries";
import { getUserRole } from "@/lib/auth/utils";
import { getCurrentUserData } from "@/lib/user-data/queries";
import type { ProposalLifecycleStatus, EvaluationStatus } from "@/models";

type FacultyLoadStatusProps = {
  academicTermId: string;
  facultyId: string;
  facultyCampusCode: string | null;
};

const readableLifecycle: Record<ProposalLifecycleStatus, string> = {
  ACTIVE: "Active proposal",
  APPROVED: "Approved proposal",
  REJECTED: "Rejected proposal",
  INVALIDATED: "Invalidated proposal",
};

const resolveCampusDirectorStatus = (
  lifecycleStatus: ProposalLifecycleStatus,
  latestEvaluationStatus?: EvaluationStatus | null,
): "PENDING" | "APPROVED" | "REJECTED" => {
  if (latestEvaluationStatus === "APPROVED") return "APPROVED";
  if (latestEvaluationStatus === "REJECTED") return "REJECTED";
  if (lifecycleStatus === "APPROVED") return "APPROVED";
  if (lifecycleStatus === "REJECTED") return "REJECTED";
  return "PENDING";
};

const FacultyLoadStatus = async ({
  academicTermId,
  facultyId,
  facultyCampusCode,
}: FacultyLoadStatusProps) => {
  const [proposal, roles, currentUserData] = await Promise.all([
    getLatestProposalByUserTerm(facultyId, academicTermId),
    getUserRole(),
    getCurrentUserData({ includeDesignations: true }),
  ]);

  const canCreateProposal =
    roles.includes("Admin") ||
    roles.includes("Program Chairperson") ||
    roles.includes("College Dean");

  const evaluations = proposal
    ? await getEvaluationsByProposal(proposal.id)
    : [];
  const latestEvaluation = evaluations[0] ?? null;

  const campusDirectorStatus = proposal
    ? resolveCampusDirectorStatus(
        proposal.lifecycle_status,
        latestEvaluation?.status ?? null,
      )
    : "PENDING";

  const matchingDesignation = proposal
    ? currentUserData?.designations.find(
        (designation) =>
          designation.job_title === "Campus Director" &&
          designation.campus?.code === facultyCampusCode,
      )
    : null;

  const canApprove =
    !!proposal &&
    proposal.lifecycle_status === "ACTIVE" &&
    !latestEvaluation &&
    !!matchingDesignation;

  const canRecreate =
    !!proposal &&
    canCreateProposal &&
    (proposal.lifecycle_status === "INVALIDATED" ||
      proposal.lifecycle_status === "REJECTED");

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-lg">FTL Status</CardTitle>
        {proposal && (
          <span className="text-xs text-foreground/60">
            {readableLifecycle[proposal.lifecycle_status]}
          </span>
        )}
      </CardHeader>
      <CardContent className="overflow-hidden space-y-4">
        {!proposal && (
          <div className="border border-dashed p-4 flex flex-col items-center justify-center gap-2 text-sm text-foreground/70">
            <p>This FTL has no proposal yet.</p>
            {canCreateProposal && (
              <form action={createProposalAction}>
                <input type="hidden" name="academicTermId" value={academicTermId} />
                <input type="hidden" name="facultyId" value={facultyId} />
                <Button size="sm">Create Proposal</Button>
              </form>
            )}
          </div>
        )}

        {proposal && (
          <>
            {proposal.lifecycle_status === "INVALIDATED" && (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Proposal invalidated
                {proposal.invalidated_reason
                  ? ` (${proposal.invalidated_reason.replaceAll("_", " ")})`
                  : "."}
              </div>
            )}

            {proposal.lifecycle_status === "REJECTED" && (
              <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                Proposal rejected by Campus Director.
              </div>
            )}

            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="flex flex-col">
                  <span>
                    {facultyCampusCode
                      ? `Campus Director (${facultyCampusCode})`
                      : "Campus Director"}
                  </span>
                  {latestEvaluation?.comment && (
                    <span className="text-xs text-foreground/60">
                      {latestEvaluation.comment}
                    </span>
                  )}
                </div>
                <span
                  className={
                    campusDirectorStatus === "APPROVED"
                      ? "text-emerald-700"
                      : campusDirectorStatus === "REJECTED"
                        ? "text-rose-700"
                        : "text-foreground/60"
                  }
                >
                  {campusDirectorStatus}
                </span>
              </div>
            </div>

            {proposal.lifecycle_status === "APPROVED" && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Finalized for campus-level consolidation.
              </div>
            )}

            {canRecreate && (
              <form action={createProposalAction} className="flex justify-end">
                <input type="hidden" name="academicTermId" value={academicTermId} />
                <input type="hidden" name="facultyId" value={facultyId} />
                <Button size="sm">Recreate Proposal</Button>
              </form>
            )}

            {canApprove && (
              <form action={submitEvaluationAction} className="space-y-2">
                <input type="hidden" name="proposalId" value={proposal.id} />
                <div className="text-sm font-medium">
                  Action required: Campus Director
                </div>
                <textarea
                  name="comment"
                  placeholder="Comment (optional)"
                  className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                />
                <div className="flex items-center gap-2">
                  <Button type="submit" name="status" value="APPROVED" size="sm">
                    Approve
                  </Button>
                  <Button
                    type="submit"
                    name="status"
                    value="REJECTED"
                    size="sm"
                    variant="outline"
                  >
                    Reject
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FacultyLoadStatus;
