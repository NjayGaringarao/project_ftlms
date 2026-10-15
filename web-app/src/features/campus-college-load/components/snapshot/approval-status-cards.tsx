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
          <div
            key={signature.label}
            className={`rounded-md border p-3 text-sm ${
              signature.decided_at
                ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                : "border-slate-200 bg-slate-100 text-slate-700"
            }`}
          >
            <p className="text-xs opacity-70">{signature.label}</p>
            <p className="mt-1 font-medium">{signature.role}</p>
            <p className="text-sm opacity-80">
              {signature.name ?? "Pending approval"}
            </p>
            {signature.decided_at ? (
              <p className="mt-1 text-xs opacity-60">
                {formatDateTime(signature.decided_at)}
              </p>
            ) : null}
          </div>
        ),
      )}
    </div>
  </div>
);
