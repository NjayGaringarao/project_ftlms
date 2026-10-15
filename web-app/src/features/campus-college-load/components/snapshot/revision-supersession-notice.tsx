import type { CampusCollegeLoadDetail } from "@/features/campus-college-load/lib/queries";
import { evaluationStepLabel } from "@/features/campus-college-load/components/campus-college-load-snapshot-summary";
import { formatDateTime } from "@/utils/time";

export const RevisionSupersessionNotice = ({
  evaluations,
}: {
  evaluations: CampusCollegeLoadDetail["evaluations"];
}) => {
  const returned = evaluations.find((evaluation) => evaluation.status === "RETURNED");

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold text-foreground">Approval Status</h3>
      <div
        className={`rounded-md border p-3 text-sm ${
          returned?.system_generated
            ? "border-red-200 bg-red-100 text-red-800"
            : "border-border"
        }`}
      >
        {!returned ? (
          <p className="text-foreground/70">
            This revision was superseded by a newer submission.
          </p>
        ) : returned.system_generated ? (
          <>
            <p className="font-medium">Automatically Invalidated</p>
            <p className="mt-1 opacity-80">{returned.comment}</p>
            <p className="mt-1 text-xs opacity-60">
              {formatDateTime(returned.created_at ?? undefined)}
            </p>
          </>
        ) : (
          <>
            <p className="font-medium">
              Returned by {evaluationStepLabel[returned.step]}
            </p>
            <p className="text-sm text-foreground/70">
              {returned.evaluator_name ?? "Unknown evaluator"}
            </p>
            {returned.comment ? (
              <p className="mt-1 text-foreground/70">{returned.comment}</p>
            ) : null}
            <p className="mt-1 text-xs text-foreground/50">
              {formatDateTime(returned.created_at ?? undefined)}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
