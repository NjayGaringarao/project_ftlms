import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
  createProposalAction,
  submitEvaluationAction,
} from "@/lib/faculty-load/actions";
import {
  getEvaluationMetadataByCampus,
  getEvaluationsByProposal,
  getLatestProposalByUserTerm,
} from "@/lib/faculty-load/queries";
import { getUserRole } from "@/lib/auth/utils";
import { getCurrentUserData } from "@/lib/user-data/queries";

type FacultyLoadStatusProps = {
  academicTermId: string;
  facultyId: string;
  facultyCampusCode: string | null;
};

type StepStatus = "PENDING" | "APPROVED" | "REJECTED";

const getRoleForLevel = (level: number): string => {
  if (level === 0) return "Campus Director";
  if (level === 1) return "Director for Instruction";
  return "University President";
};

const isApproved = (status: StepStatus) => status === "APPROVED";

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

  const metadataList = await getEvaluationMetadataByCampus(facultyCampusCode);
  const evaluations = proposal
    ? await getEvaluationsByProposal(proposal.id)
    : [];

  const latestByLevel = new Map<number, StepStatus>();
  const latestEvaluationByLevel = new Map<number, (typeof evaluations)[number]>();
  for (const evaluation of evaluations) {
    const level = evaluation.evaluation_metadata?.evaluation_level;
    if (level === undefined || level === null) continue;
    if (!latestByLevel.has(level)) {
      latestByLevel.set(level, evaluation.status as StepStatus);
      latestEvaluationByLevel.set(level, evaluation);
    }
  }

  const steps = [0, 1, 2].map((level) => {
    const metadata = metadataList.find(
      (item) => item.evaluation_level === level,
    );
    const status = latestByLevel.get(level) ?? "PENDING";
    const label =
      level === 0 && facultyCampusCode
        ? `Campus Director (${facultyCampusCode})`
        : getRoleForLevel(level);

    return {
      level,
      label,
      metadata,
      status,
    };
  });

  const currentStep = steps.find((step) => !isApproved(step.status));
  const isFinal = proposal?.is_valid && !currentStep;

  const matchingDesignation = currentStep
    ? currentUserData?.designations.find((designation) => {
        if (designation.job_title !== getRoleForLevel(currentStep.level))
          return false;
        if (designation.job_title !== "Campus Director") return true;
        return designation.campus?.code === facultyCampusCode;
      })
    : null;

  const canApprove =
    !!proposal?.is_valid &&
    !!currentStep?.metadata?.id &&
    !!matchingDesignation;

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-lg">FTL Status</CardTitle>
        {proposal && (
          <span className="text-xs text-foreground/60">
            {proposal.is_valid ? "Valid proposal" : "Invalid proposal"}
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
            {!proposal.is_valid && (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Proposal invalidated by load/designation changes.
              </div>
            )}

            <div className="grid gap-2 text-sm">
              {steps.map((step) => (
                <div
                  key={step.level}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span>{step.label}</span>
                    {latestEvaluationByLevel.get(step.level)?.comment && (
                      <span className="text-xs text-foreground/60">
                        {latestEvaluationByLevel.get(step.level)?.comment}
                      </span>
                    )}
                  </div>
                  <span
                    className={
                      step.status === "APPROVED"
                        ? "text-emerald-700"
                        : step.status === "REJECTED"
                          ? "text-rose-700"
                          : "text-foreground/60"
                    }
                  >
                    {step.status}
                  </span>
                </div>
              ))}
            </div>

            {isFinal && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Finalized. All approval steps are complete.
              </div>
            )}

            {canCreateProposal && !proposal.is_valid && (
              <form action={createProposalAction} className="flex justify-end">
                <input type="hidden" name="academicTermId" value={academicTermId} />
                <input type="hidden" name="facultyId" value={facultyId} />
                <Button size="sm">Recreate Proposal</Button>
              </form>
            )}

            {canApprove && currentStep && (
              <form action={submitEvaluationAction} className="space-y-2">
                <input type="hidden" name="proposalId" value={proposal.id} />
                <input
                  type="hidden"
                  name="evaluationMetadataId"
                  value={currentStep.metadata?.id ?? ""}
                />
                <div className="text-sm font-medium">
                  Action required: {currentStep.label}
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
