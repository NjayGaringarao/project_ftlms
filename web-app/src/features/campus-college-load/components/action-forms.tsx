"use client";

import { useActionState } from "react";
import { Check, RotateCcw, Send, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileAttachmentComposer } from "@/components/ui/file-attachment-composer";
import {
  createOrResubmitCampusCollegeLoadAction,
  submitCampusCollegeLoadEvaluationAction,
} from "@/features/campus-college-load/lib/actions";
import type { CampusCollegeLoadEvaluationStep } from "@/features/shared/types/models";

const initialState: { error?: string; success?: string } = {};

const FormMessage = ({
  state,
}: {
  state: { error?: string; success?: string };
}) => {
  if (!state.error && !state.success) return null;
  return (
    <p
      className={`text-xs ${
        state.error ? "text-destructive" : "text-emerald-700"
      }`}
    >
      {state.error ?? state.success}
    </p>
  );
};

export const SubmitCampusCollegeLoadForm = ({
  academicTermId,
  campusId,
  collegeId,
  label,
  className = "flex flex-col gap-2",
  buttonClassName = "w-full",
}: {
  academicTermId: string;
  campusId: string;
  collegeId: string;
  label: string;
  className?: string;
  buttonClassName?: string;
}) => {
  const [state, formAction, pending] = useActionState(
    createOrResubmitCampusCollegeLoadAction,
    initialState,
  );

  return (
    <form action={formAction} className={className}>
      <input type="hidden" name="academicTermId" value={academicTermId} />
      <input type="hidden" name="campusId" value={campusId} />
      <input type="hidden" name="collegeId" value={collegeId} />
      <Button type="submit" size="sm" disabled={pending} className={buttonClassName}>
        {label.includes("Resubmit") ? (
          <RotateCcw className="h-4 w-4" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {pending ? "Submitting..." : label}
      </Button>
      <FormMessage state={state} />
    </form>
  );
};

const nextStepLabel: Record<CampusCollegeLoadEvaluationStep, string | null> = {
  CAMPUS_DIRECTOR: "Director for Instruction",
  DIRECTOR_FOR_INSTRUCTION: "Vice President for Academic Affairs",
  VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS: null,
};

export const ApproveConfirmForm = ({
  revisionId,
  step,
  onCancel,
}: {
  revisionId: string;
  step: CampusCollegeLoadEvaluationStep;
  onCancel: () => void;
}) => {
  const [state, formAction, pending] = useActionState(
    submitCampusCollegeLoadEvaluationAction,
    initialState,
  );
  const next = nextStepLabel[step];

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="revisionId" value={revisionId} />
      <input type="hidden" name="step" value={step} />
      <input type="hidden" name="status" value="APPROVED" />
      <input type="hidden" name="comment" value="" />
      <p className="text-sm text-foreground/70">
        {next
          ? `Approving this load will send it to the ${next} for the next review step.`
          : "Approving this load will mark it as fully Approved. This finalizes the campus-college load for this term."}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending} className="flex-1">
          <Check className="h-4 w-4" />
          {pending ? "Submitting..." : "Approve"}
        </Button>
      </div>
      <FormMessage state={state} />
    </form>
  );
};

export const ReturnConfirmForm = ({
  revisionId,
  step,
  onCancel,
}: {
  revisionId: string;
  step: CampusCollegeLoadEvaluationStep;
  onCancel: () => void;
}) => {
  const [state, formAction, pending] = useActionState(
    submitCampusCollegeLoadEvaluationAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="revisionId" value={revisionId} />
      <input type="hidden" name="step" value={step} />
      <input type="hidden" name="status" value="RETURNED" />
      <p className="text-sm text-foreground/70">
        Returning this load will send it back to the Program Chairperson for
        revision. They will need to address your feedback and resubmit before
        it can be evaluated again.
      </p>
      <FileAttachmentComposer
        fileInputName="attachment"
        commentName="comment"
        commentPlaceholder="Explain what needs to change"
        required
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="outline"
          disabled={pending}
          className="flex-1"
        >
          <Undo2 className="h-4 w-4" />
          {pending ? "Submitting..." : "Return"}
        </Button>
      </div>
      <FormMessage state={state} />
    </form>
  );
};
