import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { submitCampusProposalEvaluationAction } from "@/lib/faculty-load/actions";
import { getCampusProposalReviewBundle } from "@/lib/faculty-load/queries";
import { getCurrentUserData } from "@/lib/user-data/queries";
import CampusProposalSummary from "@/components/ftl-evaluation/shared/campus-proposal-summary";
import type { CampusProposalStep } from "@/models";

type UniversityEvaluationWorkspaceProps = {
  academicTermId: string;
  campusId: string;
  campusCode: string;
  campusName: string;
};

const stepLabel: Record<CampusProposalStep, string> = {
  DIRECTOR_FOR_INSTRUCTION: "Director for Instruction",
  VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS: "VP for Academic Affairs",
};

const UniversityEvaluationWorkspace = async ({
  academicTermId,
  campusId,
  campusCode,
  campusName,
}: UniversityEvaluationWorkspaceProps) => {
  const [bundle, currentUserData] = await Promise.all([
    getCampusProposalReviewBundle(campusId, academicTermId),
    getCurrentUserData({ includeDesignations: true }),
  ]);

  const { campusProposal, members, evaluations } = bundle;
  const dfiEvaluation =
    evaluations.find((evaluation) => evaluation.step === "DIRECTOR_FOR_INSTRUCTION") ??
    null;
  const vpaaEvaluation =
    evaluations.find(
      (evaluation) => evaluation.step === "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS",
    ) ?? null;

  const hasDfiDesignation = (currentUserData?.designations ?? []).some(
    (designation) => designation.job_title === "Director for Instruction",
  );
  const hasVpaaDesignation = (currentUserData?.designations ?? []).some(
    (designation) =>
      designation.job_title === "Vice President for Academic Affairs",
  );

  const canEvaluateAsDfi =
    !!campusProposal &&
    campusProposal.lifecycle_status === "ACTIVE" &&
    !dfiEvaluation &&
    hasDfiDesignation;

  const canEvaluateAsVpaa =
    !!campusProposal &&
    campusProposal.lifecycle_status === "ACTIVE" &&
    dfiEvaluation?.status === "APPROVED" &&
    !vpaaEvaluation &&
    hasVpaaDesignation;

  const nextStep: CampusProposalStep | null = canEvaluateAsDfi
    ? "DIRECTOR_FOR_INSTRUCTION"
    : canEvaluateAsVpaa
      ? "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS"
      : null;

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
          <CardTitle className="text-base">DI / VPAA Action</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {nextStep && campusProposal && (
            <form action={submitCampusProposalEvaluationAction} className="space-y-2">
              <input type="hidden" name="campusProposalId" value={campusProposal.id} />
              <input type="hidden" name="step" value={nextStep} />
              <p className="font-medium">Step: {stepLabel[nextStep]}</p>
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

          {!nextStep && (
            <p className="text-foreground/70">
              No pending action for your current designation, or this campus
              proposal is already finalized.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UniversityEvaluationWorkspace;
