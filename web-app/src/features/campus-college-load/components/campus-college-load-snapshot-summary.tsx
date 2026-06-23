"use client";

import { type ReactNode, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppDialog } from "@/components/ui/app-dialog";
import type { CampusCollegeLoadDetail } from "@/features/campus-college-load/lib/queries";
import {
  ApproveConfirmForm,
  ReturnConfirmForm,
} from "@/features/campus-college-load/components/action-forms";
import { FacultyLoadTable } from "@/features/campus-college-load/components/snapshot/faculty-load-table";
import { ClassScheduleTable } from "@/features/campus-college-load/components/snapshot/class-schedule-table";
import { ApprovalStatusCards } from "@/features/campus-college-load/components/snapshot/approval-status-cards";
import { RevisionSupersessionNotice } from "@/features/campus-college-load/components/snapshot/revision-supersession-notice";
import { ReturnReasonSection } from "@/features/campus-college-load/components/snapshot/return-reason-section";
import { RevisionHeader } from "@/features/campus-college-load/components/snapshot/revision-header";
import { FileItem } from "@/features/files/components/file-item";
import { normalizeCampusCollegeLoadSnapshot } from "@/features/shared/types/models";
import { formatDateTime } from "@/utils/time";

export const statusClass: Record<string, string> = {
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
  SUBMITTED: "border-sky-200 bg-sky-100 text-sky-800",
  RETURNED: "border-amber-200 bg-amber-100 text-amber-900",
  APPROVED: "border-emerald-200 bg-emerald-100 text-emerald-800",
};

export const stepLabel: Record<string, string> = {
  PROGRAM_CHAIR: "Program Chairperson",
  CAMPUS_DIRECTOR: "Campus Director",
  DIRECTOR_FOR_INSTRUCTION: "Director for Instruction",
  VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS: "VPAA",
  COMPLETED: "Completed",
};

export const evaluationStepLabel: Record<string, string> = {
  CAMPUS_DIRECTOR: "Campus Director",
  DIRECTOR_FOR_INSTRUCTION: "Director for Instruction",
  VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS: "VPAA",
};

export const SnapshotSummary = ({
  detail,
}: {
  detail: CampusCollegeLoadDetail;
}) => {
  const normalized = normalizeCampusCollegeLoadSnapshot(
    detail.viewed_revision?.snapshot ?? null,
  );

  if (!normalized) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-foreground/70">
          No submitted revision yet.
        </CardContent>
      </Card>
    );
  }

  const { faculty_load, class_schedule, legacy } = normalized;

  return (
    <div className="flex flex-col gap-4">
      <FacultyLoadTable faculty={faculty_load.faculty} />
      <ClassScheduleTable
        classes={class_schedule.classes}
        sections={class_schedule.sections}
        legacy={legacy}
        revisionId={detail.viewed_revision?.id ?? ""}
        academicTermId={detail.load.academic_term_id}
      />
      {detail.viewed_revision?.id !== detail.latest_revision?.id ? (
        <RevisionSupersessionNotice evaluations={detail.evaluations} />
      ) : detail.load.status === "RETURNED" ? (
        <ReturnReasonSection evaluations={detail.evaluations} />
      ) : (
        <ApprovalStatusCards signatures={detail.signatures} />
      )}
    </div>
  );
};

export const LadderHistoryContent = ({
  detail,
}: {
  detail: CampusCollegeLoadDetail;
}) => (
  <div className="space-y-3">
    {detail.revisions.length > 0 ? (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Revision History</h3>
        {detail.revisions.map((revision) => (
          <div key={revision.id} className="rounded-md border p-3 text-sm">
            <p className="font-medium">Revision {revision.revision_number}</p>
            <p className="text-xs text-foreground/60">
              Submitted {formatDateTime(revision.submitted_at ?? undefined)}
            </p>
            <p className="text-xs text-foreground/60">
              By {revision.submitted_by_name ?? "Unknown submitter"}
            </p>
          </div>
        ))}
      </div>
    ) : null}

    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Ladder History</h3>
      {detail.evaluations.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-sm text-foreground/70">
          No decisions yet.
        </p>
      ) : null}
      {detail.evaluations.map((evaluation) => (
        <div key={evaluation.id} className="rounded-md border p-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium">
              {evaluation.system_generated
                ? "Automatic Return"
                : evaluationStepLabel[evaluation.step]}
            </p>
            <span
              className={`rounded border px-1.5 py-0.5 text-xs ${
                evaluation.status === "APPROVED"
                  ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                  : "border-amber-200 bg-amber-100 text-amber-900"
              }`}
            >
              {evaluation.status}
            </span>
          </div>
          {evaluation.comment ? (
            <p className="mt-2 text-foreground/70">{evaluation.comment}</p>
          ) : null}
          {evaluation.system_generated ? (
            <p className="mt-2 text-xs text-foreground/50">
              Source schedule data changed after this revision was submitted.
            </p>
          ) : null}
          {evaluation.attachments.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {evaluation.attachments.map((attachment) => (
                <FileItem
                  key={attachment.id}
                  fileName={attachment.file_name}
                  fileSizeLabel=""
                  status="Committed"
                  previewUrl={attachment.signed_url}
                  mimeType={attachment.mime_type}
                  hideStatus
                  hideRemoveAction
                  layout="compact"
                />
              ))}
            </div>
          ) : null}
          <p className="mt-2 text-xs text-foreground/50">
            {formatDateTime(evaluation.created_at ?? undefined)}
          </p>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Status row + History dialog + SnapshotSummary shared by both the Program
 * Chair and Evaluator views. Only the action button (Submit/Resubmit vs.
 * Evaluate) and the optional revision selector differ between the two.
 */
export const CampusCollegeLoadDetailPanel = ({
  detail,
  actionSlot,
  revisionSlot,
}: {
  detail: CampusCollegeLoadDetail;
  actionSlot?: ReactNode;
  revisionSlot?: ReactNode;
}) => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const statusLine =
    stepLabel[detail.load.current_step] !== "COMPLETED"
      ? `For approval by ${stepLabel[detail.load.current_step]}`
      : "Approval Complete";

  return (
    <div className="flex flex-col gap-4">
      <RevisionHeader
        revisionNumber={detail.viewed_revision?.revision_number ?? 0}
        submittedAt={detail.viewed_revision?.submitted_at}
        statusLine={statusLine}
        revisionSlot={revisionSlot}
        actionSlot={actionSlot}
        onHistoryClick={() => setHistoryOpen(true)}
      />

      <SnapshotSummary detail={detail} />

      <AppDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        title="Load History"
        variant="floating-medium"
        contentClassName="p-4"
      >
        <LadderHistoryContent detail={detail} />
      </AppDialog>
    </div>
  );
};

export const ActionContent = ({
  detail,
}: {
  detail: CampusCollegeLoadDetail | null;
}) => {
  const [view, setView] = useState<"choose" | "approve" | "return">("choose");
  const latestRevision = detail?.latest_revision ?? null;

  if (!latestRevision || !detail?.can_evaluate_step) {
    return (
      <p className="rounded-md border border-dashed p-4 text-sm text-foreground/70">
        There is no available action for your role at the current step.
      </p>
    );
  }

  if (view === "approve") {
    return (
      <ApproveConfirmForm
        revisionId={latestRevision.id}
        step={detail.can_evaluate_step}
        onCancel={() => setView("choose")}
      />
    );
  }

  if (view === "return") {
    return (
      <ReturnConfirmForm
        revisionId={latestRevision.id}
        step={detail.can_evaluate_step}
        onCancel={() => setView("choose")}
      />
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        className="flex-1"
        onClick={() => setView("return")}
      >
        Return / Disapprove
      </Button>
      <Button
        type="button"
        className="flex-1"
        onClick={() => setView("approve")}
      >
        <Check className="h-4 w-4" />
        Approve
      </Button>
    </div>
  );
};
