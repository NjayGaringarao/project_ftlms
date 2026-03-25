import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { submitCampusProposalEvaluationAction } from "@/lib/faculty-load/actions";
import {
  getCampusProposalEvaluations,
  getCampusProposalMembers,
  getLatestCampusProposalByCampusTerm,
} from "@/lib/faculty-load/queries";
import { getCurrentUserData } from "@/lib/user-data/queries";
import type {
  CampusProposalStep,
  EvaluationStatus,
  ProposalLifecycleStatus,
} from "@/models";
import { formatDateTime } from "@/utils/time";

type CampusEvaluationWorkspaceProps = {
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

const evaluationStyle: Record<EvaluationStatus, string> = {
  PENDING: "bg-slate-100 text-slate-700 border-slate-200",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
};

const stepLabel: Record<CampusProposalStep, string> = {
  DIRECTOR_FOR_INSTRUCTION: "Director for Instruction",
  VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS: "VP for Academic Affairs",
};

const toFixed = (value: number | string | null) => {
  const parsed = Number(value ?? NaN);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "-";
};

const CampusEvaluationWorkspace = async ({
  academicTermId,
  campusId,
  campusCode,
  campusName,
}: CampusEvaluationWorkspaceProps) => {
  const [campusProposal, currentUserData] = await Promise.all([
    getLatestCampusProposalByCampusTerm(campusId, academicTermId),
    getCurrentUserData({ includeDesignations: true }),
  ]);

  const [members, evaluations] = await Promise.all([
    campusProposal
      ? getCampusProposalMembers(campusProposal.id)
      : Promise.resolve([]),
    campusProposal
      ? getCampusProposalEvaluations(campusProposal.id)
      : Promise.resolve([]),
  ]);

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

  const totalAtl = members.reduce(
    (sum, member) => sum + Number(member.actual_teaching_load ?? 0),
    0,
  );
  const totalLecture = members.reduce(
    (sum, member) => sum + Number(member.total_lecture_hours ?? 0),
    0,
  );
  const totalLab = members.reduce(
    (sum, member) => sum + Number(member.total_lab_hours ?? 0),
    0,
  );

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campus Proposal Workspace</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground/80 space-y-1">
          <p>
            <b>Campus:</b> {campusName} ({campusCode})
          </p>
          <p>
            <b>Term:</b> {academicTermId}
          </p>
          <p>
            <b>Campus ID:</b> {campusId}
          </p>
        </CardContent>
      </Card>

      {!campusProposal && (
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-base">Campus Evaluation</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-foreground/70">
            No campus proposal found for this campus and term yet. Waiting for
            Campus Director submission.
          </CardContent>
        </Card>
      )}

      {campusProposal && (
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3 flex min-h-0 flex-col overflow-hidden">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-base">Campus Proposal Members</CardTitle>
              <span
                className={`rounded-md border px-2 py-1 text-xs font-medium ${lifecycleStyle[campusProposal.lifecycle_status]}`}
              >
                {lifecycleLabel[campusProposal.lifecycle_status]}
              </span>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-md border p-2">
                  <p className="text-foreground/70">Faculty Count</p>
                  <p className="font-semibold">{members.length}</p>
                </div>
                <div className="rounded-md border p-2">
                  <p className="text-foreground/70">Total ATL</p>
                  <p className="font-semibold">{totalAtl.toFixed(2)}</p>
                </div>
                <div className="rounded-md border p-2">
                  <p className="text-foreground/70">Lecture / Lab</p>
                  <p className="font-semibold">
                    {totalLecture.toFixed(2)} / {totalLab.toFixed(2)}
                  </p>
                </div>
              </div>

              <table className="w-full text-sm rounded-md overflow-hidden">
                <thead className="sticky top-0 border-b bg-foreground/10">
                  <tr className="text-left text-xs">
                    <th className="px-2 py-2">Faculty</th>
                    <th className="px-2 py-2">Employment</th>
                    <th className="px-2 py-2">ATL</th>
                    <th className="px-2 py-2">ETL</th>
                    <th className="px-2 py-2">Lecture</th>
                    <th className="px-2 py-2">Lab</th>
                    <th className="px-2 py-2">Prep</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b">
                      <td className="px-2 py-2">
                        {member.proposal_user?.identity?.name ?? "Unknown Faculty"}
                      </td>
                      <td className="px-2 py-2">{member.employment_status}</td>
                      <td className="px-2 py-2">
                        {toFixed(member.actual_teaching_load)}
                      </td>
                      <td className="px-2 py-2">
                        {toFixed(member.equivalent_teaching_load)}
                      </td>
                      <td className="px-2 py-2">
                        {toFixed(member.total_lecture_hours)}
                      </td>
                      <td className="px-2 py-2">{toFixed(member.total_lab_hours)}</td>
                      <td className="px-2 py-2">{member.preparation_count ?? "-"}</td>
                    </tr>
                  ))}

                  {members.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-2 py-4 text-center text-foreground/70"
                      >
                        No copied individual proposal members found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 flex min-h-0 flex-col gap-4 overflow-hidden">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evaluation Trail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Director for Instruction</p>
                    <span
                      className={`rounded border px-1.5 py-0.5 text-xs ${evaluationStyle[dfiEvaluation?.status ?? "PENDING"]}`}
                    >
                      {dfiEvaluation?.status ?? "PENDING"}
                    </span>
                  </div>
                  <p className="mt-1 text-foreground/70">
                    {dfiEvaluation?.comment ?? "No comment yet."}
                  </p>
                </div>

                <div className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">VP for Academic Affairs</p>
                    <span
                      className={`rounded border px-1.5 py-0.5 text-xs ${evaluationStyle[vpaaEvaluation?.status ?? "PENDING"]}`}
                    >
                      {vpaaEvaluation?.status ?? "PENDING"}
                    </span>
                  </div>
                  <p className="mt-1 text-foreground/70">
                    {vpaaEvaluation?.comment ?? "No comment yet."}
                  </p>
                </div>

                <p className="text-xs text-foreground/60">
                  Campus proposal created on{" "}
                  {formatDateTime(campusProposal.created_at ?? undefined)}.
                </p>
              </CardContent>
            </Card>

            <Card className="min-h-0 flex-1 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">DI / VPAA Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm overflow-y-auto">
                {nextStep && (
                  <form action={submitCampusProposalEvaluationAction} className="space-y-2">
                    <input
                      type="hidden"
                      name="campusProposalId"
                      value={campusProposal.id}
                    />
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
        </div>
      )}
    </div>
  );
};

export default CampusEvaluationWorkspace;
