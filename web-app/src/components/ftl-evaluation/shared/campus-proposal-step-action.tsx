"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import RejectionCommentDialog from "@/components/ftl-evaluation/faculty-load/rejection-comment-dialog";
import { submitCampusProposalEvaluationAction } from "@/lib/proposal/actions";
import type { CampusProposalStep } from "@/models";

type CampusProposalStepActionProps = {
  campusProposalId: string;
  step: CampusProposalStep;
  rejectTitle: string;
  rejectDescription: string;
};

const CampusProposalStepAction = ({
  campusProposalId,
  step,
  rejectTitle,
  rejectDescription,
}: CampusProposalStepActionProps) => {
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const handleRejectSubmit = async (formData: FormData) => {
    await submitCampusProposalEvaluationAction(formData);
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
        <form action={submitCampusProposalEvaluationAction}>
          <input type="hidden" name="campusProposalId" value={campusProposalId} />
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
          { name: "campusProposalId", value: campusProposalId },
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

export default CampusProposalStepAction;
