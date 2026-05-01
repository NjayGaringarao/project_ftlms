"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import RejectionCommentDialog from "@/features/ftl-evaluation/components/faculty-load/rejection-comment-dialog";
import { submitCampusLoadEvaluationAction } from "@/features/ftl-evaluation/lib/load-proposal/actions";
import type { CampusLoadStep } from "@/features/shared/types/models";

type CampusLoadStepActionProps = {
  campusLoadId: string;
  step: CampusLoadStep;
  rejectTitle: string;
  rejectDescription: string;
};

const CampusLoadStepAction = ({
  campusLoadId,
  step,
  rejectTitle,
  rejectDescription,
}: CampusLoadStepActionProps) => {
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const handleRejectSubmit = async (formData: FormData) => {
    await submitCampusLoadEvaluationAction(formData);
    setIsRejectDialogOpen(false);
  };

  return (
    <>
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
        <form action={submitCampusLoadEvaluationAction}>
          <input type="hidden" name="campusLoadId" value={campusLoadId} />
          <input type="hidden" name="step" value={step} />
          <input type="hidden" name="status" value="APPROVED" />
          <Button type="submit" size="sm">
            <Check className="h-4 w-4" />
            Approve
          </Button>
        </form>
      </div>

      <RejectionCommentDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        title={rejectTitle}
        description={rejectDescription}
        action={handleRejectSubmit}
        hiddenFields={[
          { name: "campusLoadId", value: campusLoadId },
          { name: "step", value: step },
          { name: "status", value: "REJECTED" },
        ]}
        isCommentRequired={false}
        commentPlaceholder="Comment (optional)"
        confirmLabel="Reject"
      />
    </>
  );
};

export default CampusLoadStepAction;
