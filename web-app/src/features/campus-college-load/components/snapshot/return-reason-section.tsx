import type { CampusCollegeLoadDetail } from "@/features/campus-college-load/lib/queries";
import { evaluationStepLabel } from "@/features/campus-college-load/components/campus-college-load-snapshot-summary";
import { FileItem } from "@/features/files/components/file-item";
import { formatDateTime } from "@/utils/time";

export const ReturnReasonSection = ({
  evaluations,
}: {
  evaluations: CampusCollegeLoadDetail["evaluations"];
}) => {
  const returned = evaluations.find((e) => e.status === "RETURNED");

  if (!returned) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold text-foreground">Approval Status</h3>
      <div className="rounded-md border p-3">
        {returned.system_generated ? (
          <>
            <p className="font-medium">Automatically Invalidated</p>
            {returned.comment ? (
              <p className="mt-1 text-foreground/70">{returned.comment}</p>
            ) : null}
            <p className="mt-1 text-xs text-foreground/50">
              {formatDateTime(returned.created_at ?? undefined)}
            </p>
          </>
        ) : (
          <>
            <div className="font-medium flex flex-row gap-1 items-center">
              <p>
                Returned by {returned.evaluator_name ?? "Unknown evaluator"}
              </p>
              <p className="text-foreground/70">
                ({evaluationStepLabel[returned.step]})
              </p>
            </div>

            {returned.comment ? (
              <p className="mt-2 pt-2 text-foreground/70 italic border-t">
                {returned.comment}
              </p>
            ) : null}
            {returned.attachments.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {returned.attachments.map((attachment) => (
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
              {formatDateTime(returned.created_at ?? undefined)}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
