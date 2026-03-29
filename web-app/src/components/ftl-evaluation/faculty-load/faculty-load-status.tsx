"use client";

import { useState } from "react";
import { Check, Download, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createProposalAction,
  submitEvaluationAction,
} from "@/lib/load-proposal/actions";
import { deriveCampusLoadLadderState } from "@/lib/load-proposal/ladder";
import type {
  CampusLoad,
  CampusLoadEvaluation,
  EvaluationStatus,
  FacultyLoadEvaluation,
  FacultyLoadProposal,
} from "@/models";
import { formatDateTime } from "@/utils/time";
import CampusLoadLadderGrid from "@/components/ftl-evaluation/shared/campus-load-ladder-grid";
import RejectionCommentDialog from "@/components/ftl-evaluation/faculty-load/rejection-comment-dialog";
import { Popover } from "radix-ui";

type FacultyLoadStatusProps = {
  proposal: FacultyLoadProposal | null;
  latestEvaluation: FacultyLoadEvaluation | null;
  campusDirectorStatus: EvaluationStatus | "INVALIDATED";
  canEvaluateProposal: boolean;
  linkedCampusLoad: CampusLoad | null;
  linkedCampusLoadEvaluations: CampusLoadEvaluation[];
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

const FacultyLoadStatus = ({
  proposal,
  latestEvaluation,
  campusDirectorStatus,
  canEvaluateProposal,
  linkedCampusLoad,
  linkedCampusLoadEvaluations,
  academicTermId,
  facultyId,
  canCreateProposal = false,
  canRecreateProposal = false,
}: FacultyLoadStatusProps) => {
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const handleRejectSubmit = async (formData: FormData) => {
    await submitEvaluationAction(formData);
    setIsRejectDialogOpen(false);
  };

  const {
    diEvaluation,
    vpaaEvaluation,
    hasRenderableCampusLoad,
    showDiCard,
    showVpaaCard,
  } = deriveCampusLoadLadderState({
    campusLoad: linkedCampusLoad,
    evaluations: linkedCampusLoadEvaluations,
  });

  const canSubmitProposal =
    !proposal && canCreateProposal && !!academicTermId && !!facultyId;
  const canSubmitRecreate =
    !!proposal && canRecreateProposal && !!academicTermId && !!facultyId;
  const canExportDocument = !!proposal && !!academicTermId && !!facultyId;
  const exportDisabledMessage =
    "Export is available once a faculty load proposal exists.";

  const pdfExportPath =
    canExportDocument && academicTermId && facultyId
      ? `/api/puppeteer/pdf/faculty-load/${academicTermId}/${facultyId}`
      : null;
  const printExportPath =
    canExportDocument && academicTermId && facultyId
      ? `/print/faculty-load/${academicTermId}/${facultyId}?autoPrint=1`
      : null;

  const openExportWindow = (path: string | null) => {
    if (!path) return;
    window.open(path, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <Card className="h-fit gap-0">
        <CardHeader className="flex flex-row justify-between items-center gap-4 text-sm pb-4">
          <div className="flex flex-row gap-2">
            <CardTitle className="text-base">Faculty Load Status</CardTitle>

            {proposal && proposal.lifecycle_status === "INVALIDATED" && (
              <span
                className={`rounded border px-1.5 py-0.5 text-xs ${evaluationStyle["INVALIDATED"]}`}
              >
                INVALIDATED
              </span>
            )}
          </div>

          <div className="flex flex-row gap-1">
            <Popover.Root>
              <Popover.Trigger asChild>
                <Button
                  variant="outline"
                  disabled={!canExportDocument}
                  title={
                    !canExportDocument
                      ? exportDisabledMessage
                      : "Export faculty teaching load"
                  }
                >
                  <Download className="h-4 w-4" /> Export FTL
                </Button>
              </Popover.Trigger>
              <Popover.Anchor />
              <Popover.Portal>
                <Popover.Content sideOffset={6} align="end">
                  <div className="flex flex-col bg-background rounded-md overflow-hidden shadow-md border">
                    <button
                      type="button"
                      className="flex items-center gap-2 px-3 py-2 text-sm  text-foreground/80 hover:bg-foreground/5"
                      disabled={!canExportDocument}
                      onClick={() => openExportWindow(pdfExportPath)}
                      title={
                        !canExportDocument
                          ? exportDisabledMessage
                          : "Download as PDF"
                      }
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/80 hover:bg-foreground/5"
                      disabled={!canExportDocument}
                      onClick={() => openExportWindow(printExportPath)}
                      title={
                        !canExportDocument
                          ? exportDisabledMessage
                          : "Open print view"
                      }
                    >
                      <Printer className="h-4 w-4" />
                      Print
                    </button>
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
            {canSubmitRecreate && (
              <form action={createProposalAction}>
                <input
                  type="hidden"
                  name="academicTermId"
                  value={academicTermId}
                />
                <input type="hidden" name="facultyId" value={facultyId} />
                <Button>Recreate Proposal</Button>
              </form>
            ) }
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="rounded-md border p-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-base text-foreground">Campus Director</p>
              <span
                className={`rounded border px-1.5 py-0.5 text-xs ${evaluationStyle[campusDirectorStatus]}`}
              >
                {campusDirectorStatus}
              </span>
            </div>
            <p className="text-sm text-foreground/60 italic">
              Comment:{" "}
              {latestEvaluation?.comment ??
                (proposal
                  ? "No comment yet."
                  : "No faculty load proposal available.")}
            </p>
            {latestEvaluation ? (
              <div className="flex flex-col items-end">
                <p className="text-xs text-foreground/60">
                  {formatDateTime(
                    latestEvaluation.created_at ?? undefined,
                    "short",
                  )}
                </p>
              </div>
            ) : null}

            {proposal && canEvaluateProposal ? (
              <div className="flex items-center gap-2 pt-2">
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
            ) : null}
          </div>

          {canSubmitProposal ? (
            <form action={createProposalAction}>
              <input
                type="hidden"
                name="academicTermId"
                value={academicTermId}
              />
              <input type="hidden" name="facultyId" value={facultyId} />
              <Button size="sm">Create Proposal</Button>
            </form>
          ) : null}

          {proposal &&
            proposal.lifecycle_status !== "INVALIDATED" &&
            linkedCampusLoad &&
            hasRenderableCampusLoad && (
              <div className="col-span-2 grid gap-2 md:grid-cols-2">
                <CampusLoadLadderGrid
                  campusLoad={linkedCampusLoad}
                  diEvaluation={diEvaluation}
                  vpaaEvaluation={vpaaEvaluation}
                  showDiCard={showDiCard}
                  showVpaaCard={showVpaaCard}
                  canEvaluateAsDi={false}
                  canEvaluateAsVpaa={false}
                />
              </div>
            )}

          {proposal &&
            campusDirectorStatus === "PENDING" &&
            !linkedCampusLoad && (
              <div className="rounded-md border border-dashed px-3 py-2 flex flex-col justify-center items-center">
                <p className="text-sm text-foreground/70">
                  Not yet part of a campus load.
                </p>
              </div>
            )}
        </CardContent>
      </Card>

      {proposal ? (
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
      ) : null}
    </>
  );
};

export default FacultyLoadStatus;
