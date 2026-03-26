import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  invalidateIndividualProposalsAction,
  submitEvaluationAction,
} from "@/lib/faculty-load/actions";
import {
  getEvaluationsByProposal,
  getLatestProposalByUserTerm,
} from "@/lib/faculty-load/queries";
import { getCurrentUserData } from "@/lib/user-data/queries";
import type { EvaluationStatus, ProposalLifecycleStatus } from "@/models";
import { formatDateTime } from "@/utils/time";

type FacultyEvaluationWorkspaceProps = {
  academicTermId: string;
  facultyId: string;
  facultyName: string;
  facultyCampusId: string | null;
  campusName: string;
  collegeName: string;
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

const toFixed = (value: number | string | null) => {
  const parsed = Number(value ?? NaN);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "-";
};

const FacultyEvaluationWorkspace = async ({
  academicTermId,
  facultyId,
  facultyName,
  facultyCampusId,
  campusName,
  collegeName,
}: FacultyEvaluationWorkspaceProps) => {
  const [proposal, currentUserData] = await Promise.all([
    getLatestProposalByUserTerm(facultyId, academicTermId),
    getCurrentUserData({ includeDesignations: true }),
  ]);

  const evaluations = proposal
    ? await getEvaluationsByProposal(proposal.id)
    : [];

  const latestEvaluation = evaluations[0] ?? null;
  const campusDirectorDesignation = facultyCampusId
    ? (currentUserData?.designations ?? []).find(
        (designation) =>
          designation.job_title === "Campus Director" &&
          designation.campus_id === facultyCampusId,
      )
    : null;

  const canEvaluateProposal =
    !!proposal &&
    proposal.lifecycle_status === "ACTIVE" &&
    !latestEvaluation &&
    !!campusDirectorDesignation;

  const canInvalidateProposal =
    !!proposal &&
    !!campusDirectorDesignation &&
    (proposal.lifecycle_status === "ACTIVE" ||
      proposal.lifecycle_status === "APPROVED");

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Faculty Proposal Workspace</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground/80 space-y-1">
          <p>
            <b>Faculty:</b> {facultyName}
          </p>
          <p>
            <b>Campus:</b> {campusName}
          </p>
          <p>
            <b>College:</b> {collegeName}
          </p>
          <p>
            <b>Term:</b> {academicTermId}
          </p>
          <p>
            <b>Faculty ID:</b> {facultyId}
          </p>
          <Link
            href={`/faculty-teaching-load/${academicTermId}/${facultyId}`}
            className="inline-block text-xs underline underline-offset-4 text-foreground/70"
          >
            Open detailed FTL workspace
          </Link>
        </CardContent>
      </Card>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3 flex min-h-0 flex-col overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">Individual Proposal</CardTitle>
            {proposal && (
              <span
                className={`rounded-md border px-2 py-1 text-xs font-medium ${lifecycleStyle[proposal.lifecycle_status]}`}
              >
                {lifecycleLabel[proposal.lifecycle_status]}
              </span>
            )}
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto space-y-4 text-sm">
            {!proposal && (
              <div className="rounded-md border border-dashed p-4 text-foreground/70">
                No proposal yet for this faculty in the selected term.
              </div>
            )}

            {proposal && (
              <>
                <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                  <p>Employment: {proposal.employment_status}</p>
                  <p>Rank: {proposal.academic_rank ?? "-"}</p>
                  <p>Bachelor&apos;s: {proposal.bachelors_degree ?? "-"}</p>
                  <p>Master&apos;s: {proposal.masters_degree ?? "-"}</p>
                  <p>Doctorate: {proposal.doctorate_degree ?? "-"}</p>
                  <p>Designations: {proposal.designations ?? "-"}</p>
                  <p>ETL: {toFixed(proposal.equivalent_teaching_load)}</p>
                  <p>ATL: {toFixed(proposal.actual_teaching_load)}</p>
                  <p>Lecture Hours: {toFixed(proposal.total_lecture_hours)}</p>
                  <p>Lab Hours: {toFixed(proposal.total_lab_hours)}</p>
                  <p>Preparations: {proposal.preparation_count ?? "-"}</p>
                  <p>Created: {formatDateTime(proposal.created_at ?? undefined)}</p>
                </div>

                {proposal.lifecycle_status === "INVALIDATED" &&
                  proposal.invalidated_reason && (
                    <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900">
                      Invalidated reason: {proposal.invalidated_reason}
                    </div>
                  )}

                {latestEvaluation ? (
                  <div className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Campus Director Decision</span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-xs ${evaluationStyle[latestEvaluation.status]}`}
                      >
                        {latestEvaluation.status}
                      </span>
                    </div>
                    <p className="text-foreground/70">
                      {latestEvaluation.comment ?? "No comment provided."}
                    </p>
                    <p className="text-xs text-foreground/60">
                      {formatDateTime(latestEvaluation.created_at ?? undefined)}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-3 text-foreground/70">
                    Pending Campus Director decision.
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle className="text-base">Campus Director Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!proposal && (
              <p className="text-foreground/70">No proposal available to evaluate.</p>
            )}

            {proposal && canEvaluateProposal && (
              <form action={submitEvaluationAction} className="space-y-2">
                <input type="hidden" name="proposalId" value={proposal.id} />
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
                    variant="outline"
                    size="sm"
                  >
                    Reject
                  </Button>
                </div>
              </form>
            )}

            {proposal && !canEvaluateProposal && (
              <p className="text-foreground/70">
                Evaluation is not available for your current role or this proposal
                state.
              </p>
            )}

            {proposal && canInvalidateProposal && (
              <form action={invalidateIndividualProposalsAction}>
                <input type="hidden" name="academicTermId" value={academicTermId} />
                <input type="hidden" name="proposalIds" value={proposal.id} />
                <Button size="sm" variant="outline">
                  Invalidate This Proposal
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FacultyEvaluationWorkspace;
