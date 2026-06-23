"use client";

import { useActionState, useState } from "react";
import { Check, RotateCcw, Send, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileField } from "@/features/files/components/file-field";
import { RETURN_ATTACHMENT_FILE_POLICY } from "@/features/files/lib/file-policy";
import type { StagedFile } from "@/features/files/lib/types";
import {
  stageReturnAttachment,
  unstageReturnAttachment,
} from "@/features/campus-college-load/lib/attachment-actions";
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
      <Button
        type="submit"
        size="sm"
        disabled={pending}
        className={buttonClassName}
      >
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
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [uploadingFileIds, setUploadingFileIds] = useState<string[]>([]);

  const stageOneFile = async (file: File) => {
    const tempId = crypto.randomUUID();
    setStagedFiles((current) => [
      ...current,
      {
        id: tempId,
        objectPath: tempId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || null,
        previewUrl: null,
        classification: "return-attachment",
        status: "UNCOMMITTED",
      },
    ]);
    setUploadingFileIds((ids) => [...ids, tempId]);

    const formData = new FormData();
    formData.set("revisionId", revisionId);
    formData.set("step", step);
    formData.set("file", file);
    const result = await stageReturnAttachment(formData);

    setUploadingFileIds((ids) => ids.filter((id) => id !== tempId));
    setStagedFiles((current) =>
      current
        .map((item) =>
          item.id === tempId ? (result.success ? result.file : null) : item,
        )
        .filter((item): item is StagedFile => item !== null),
    );
  };

  const handleAddFiles = (files: File[]) => {
    files.forEach((file) => {
      void stageOneFile(file);
    });
  };

  const handleRemoveUncommitted = async (id: string) => {
    const file = stagedFiles.find((item) => item.id === id);
    setStagedFiles((current) => current.filter((item) => item.id !== id));
    if (file && !uploadingFileIds.includes(id)) {
      await unstageReturnAttachment(file.objectPath);
    }
  };

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="revisionId" value={revisionId} />
      <input type="hidden" name="step" value={step} />
      <input type="hidden" name="status" value="RETURNED" />
      {stagedFiles
        .filter((file) => !uploadingFileIds.includes(file.id))
        .map((file) => (
          <span key={file.id}>
            <input
              type="hidden"
              name="stagedObjectPath"
              value={file.objectPath}
            />
            <input type="hidden" name="stagedFileName" value={file.fileName} />
            <input
              type="hidden"
              name="stagedFileMimeType"
              value={file.mimeType ?? ""}
            />
          </span>
        ))}
      <p className="text-sm text-foreground/70">
        Returning this load will send it back to the Program Chairperson for
        revision. They will need to address your feedback and resubmit before it
        can be evaluated again.
      </p>
      <textarea
        name="comment"
        required
        rows={3}
        className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="Explain what needs to change"
      />
      <FileField
        label="Attachments (optional)"
        uncommittedFiles={stagedFiles}
        committedFiles={[]}
        onAddFiles={handleAddFiles}
        onRemoveUncommitted={handleRemoveUncommitted}
        onRemoveCommitted={() => {}}
        allowedFileTypes={[...RETURN_ATTACHMENT_FILE_POLICY.allowedExtensions]}
        maxSizeBytes={RETURN_ATTACHMENT_FILE_POLICY.maxSizeBytes}
        multiple
        uploadingFileIds={uploadingFileIds}
        listClassName="grid grid-cols-1 sm:grid-cols-2"
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
          disabled={pending || uploadingFileIds.length > 0}
          className="flex-1"
        >
          <Undo2 className="h-4 w-4" />
          {pending ? "Submitting..." : "Return / Disapprove"}
        </Button>
      </div>
      <FormMessage state={state} />
    </form>
  );
};
