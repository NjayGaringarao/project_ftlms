"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createProposalAction,
  submitEvaluationAction,
} from "@/lib/load-proposal/actions";
import type {
  EvaluationStatus,
  FacultyLoadEvaluation,
  FacultyLoadProposal,
} from "@/models";
import { formatDateTime } from "@/utils/time";
import { Check, X } from "lucide-react";
import RejectionCommentDialog from "@/components/ftl-evaluation/faculty-load/rejection-comment-dialog";

type FacultyLoadApprovalProps = {
  proposal: FacultyLoadProposal | null;
  latestEvaluation: FacultyLoadEvaluation | null;
  campusDirectorStatus: EvaluationStatus | "INVALIDATED";
  canEvaluateProposal: boolean;
  academicTermId?: string;
  facultyId?: string;
  canCreateProposal?: boolean;
  canRecreateProposal?: boolean;
};

const evaluationStyle: Record<EvaluationStatus | "INVALIDATED", string> = {
  PENDING: "bg-slate-100 text-slate-700 border-slate-200",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
  INVALIDATED: "bg-amber-100 text-amber-900 border-amber-200",
};

const FacultyLoadApproval = ({
  proposal,
  latestEvaluation,
  campusDirectorStatus,
  canEvaluateProposal,
  academicTermId,
  facultyId,
  canCreateProposal = false,
  canRecreateProposal = false,
}: FacultyLoadApprovalProps) => {
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const handleRejectSubmit = async (formData: FormData) => {
    await submitEvaluationAction(formData);
    setIsRejectDialogOpen(false);
  };

  const canSubmitProposal =
    !proposal && canCreateProposal && !!academicTermId && !!facultyId;
  const canSubmitRecreate =
    !!proposal &&
    canRecreateProposal &&
    !!academicTermId &&
    !!facultyId;

  return (
    <>
      <Card className="h-fit gap-0">
        <CardHeader className="flex flex-row justify-between items-end gap-4 text-sm">
          <CardTitle className="text-base">Faculty Load Approval</CardTitle>
          {!proposal && <p className="text-foreground/70">No proposal available.</p>}

          {proposal && (
            <div className="flex-1">
              <span
                className={`rounded-sm border px-2 py-0.5 text-base ${evaluationStyle[campusDirectorStatus]}`}
              >
                {campusDirectorStatus}
              </span>
            </div>
          )}

          {proposal && canEvaluateProposal && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRejectDialogOpen(true)}
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
              <form action={submitEvaluationAction}>
                <input
                  type="hidden"
                  name="facultyLoadProposalId"
                  value={proposal.id}
                />
                <input type="hidden" name="status" value="APPROVED" />
                <Button type="submit" size="sm">
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
              </form>
            </div>
          )}

          {latestEvaluation && (
            <p className="text-sm text-foreground/70">
              Evaluated: {formatDateTime(latestEvaluation.created_at ?? undefined)}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3 mt-2">
          {canSubmitProposal && (
            <form action={createProposalAction}>
              <input type="hidden" name="academicTermId" value={academicTermId} />
              <input type="hidden" name="facultyId" value={facultyId} />
              <Button size="sm">Create Proposal</Button>
            </form>
          )}

          {proposal?.lifecycle_status === "INVALIDATED" && (
            <p className="text-sm text-foreground/70">
              Invalidation Reason:
              {proposal.invalidated_reason
                ? ` ${proposal.invalidated_reason.replaceAll("_", " ")}`
                : "."}
            </p>
          )}

          {proposal?.lifecycle_status === "REJECTED" && (
            <p className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">
              Proposal rejected by Campus Director.
            </p>
          )}

        

          {proposal?.lifecycle_status === "REJECTED" &&
            latestEvaluation &&
            latestEvaluation.status === "REJECTED" && (
              <p className="text-foreground/70 text-sm">
                {latestEvaluation.comment ?? "No comment provided."}
              </p>
            )}

          {canSubmitRecreate && (
            <form action={createProposalAction}>
              <input type="hidden" name="academicTermId" value={academicTermId} />
              <input type="hidden" name="facultyId" value={facultyId} />
              <Button size="sm">Recreate Proposal</Button>
            </form>
          )}
        </CardContent>
      </Card>

      {proposal && (
        <RejectionCommentDialog
          open={isRejectDialogOpen}
          onOpenChange={setIsRejectDialogOpen}
          title="Reject Faculty Proposal"
          description="Please provide a comment describing why this proposal is rejected."
          action={handleRejectSubmit}
          hiddenFields={[
            { name: "facultyLoadProposalId", value: proposal.id },
            { name: "status", value: "REJECTED" },
          ]}
        />
      )}
    </>
  );
};

export default FacultyLoadApproval;

