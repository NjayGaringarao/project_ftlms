import type { CampusCollegeLoadDetail } from "@/features/campus-college-load/lib/queries";
import { formatDateTime } from "@/utils/time";

export const ApprovalStatusCards = ({
  signatures,
}: {
  signatures: CampusCollegeLoadDetail["signatures"];
}) => (
  <div className="flex flex-col gap-2">
    <h3 className="font-semibold text-foreground">Approval Status</h3>
    <div className="grid gap-3 md:grid-cols-3">
      {[signatures.prepared, signatures.recommending_approval, signatures.approved].map(
        (signature) => (
          <div key={signature.label} className="rounded-md border p-3 text-sm">
            <p className="text-xs text-foreground/60">{signature.label}</p>
            <p className="mt-1 font-medium">{signature.role}</p>
            <p className="text-sm text-foreground/70">
              {signature.name ?? "Pending approval"}
            </p>
            {signature.decided_at ? (
              <p className="mt-1 text-xs text-foreground/50">
                {formatDateTime(signature.decided_at)}
              </p>
            ) : null}
          </div>
        ),
      )}
    </div>
  </div>
);
