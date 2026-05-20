"use client";

import { useActionState } from "react";
import { Check, RotateCcw, Send, Upload, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createOrResubmitCampusCollegeLoadAction,
  submitCampusCollegeLoadEvaluationAction,
} from "@/features/campus-college-load/lib/actions";
import type {
  CampusCollegeLoadEvaluationStep,
  CampusCollegeLoadEvaluationStatus,
} from "@/features/shared/types/models";

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
}: {
  academicTermId: string;
  campusId: string;
  collegeId: string;
  label: string;
}) => {
  const [state, formAction, pending] = useActionState(
    createOrResubmitCampusCollegeLoadAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="academicTermId" value={academicTermId} />
      <input type="hidden" name="campusId" value={campusId} />
      <input type="hidden" name="collegeId" value={collegeId} />
      <Button type="submit" size="sm" disabled={pending}>
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

export const CampusCollegeLoadEvaluationForm = ({
  revisionId,
  step,
  status,
}: {
  revisionId: string;
  step: CampusCollegeLoadEvaluationStep;
  status: CampusCollegeLoadEvaluationStatus;
}) => {
  const [state, formAction, pending] = useActionState(
    submitCampusCollegeLoadEvaluationAction,
    initialState,
  );
  const isReturn = status === "RETURNED";

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-md border p-3">
      <input type="hidden" name="revisionId" value={revisionId} />
      <input type="hidden" name="step" value={step} />
      <input type="hidden" name="status" value={status} />
      {isReturn ? (
        <>
          <textarea
            name="comment"
            required
            rows={3}
            className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Return comment"
          />
          <label className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-foreground/70">
            <Upload className="h-4 w-4" />
            <span className="flex-1">Optional PDF attachment</span>
            <input
              name="attachment"
              type="file"
              accept="application/pdf,.pdf"
              className="w-44 text-xs"
            />
          </label>
        </>
      ) : (
        <input type="hidden" name="comment" value="" />
      )}
      <Button
        type="submit"
        size="sm"
        variant={isReturn ? "outline" : "default"}
        disabled={pending}
      >
        {isReturn ? <Undo2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
        {pending ? "Submitting..." : isReturn ? "Return" : "Approve"}
      </Button>
      <FormMessage state={state} />
    </form>
  );
};
