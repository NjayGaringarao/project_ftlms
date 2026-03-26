import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  CampusProposal,
  CampusProposalEvaluation,
  EvaluationStatus,
  ProposalLifecycleStatus,
} from "@/models";
import type { CampusProposalMemberWithFaculty } from "@/lib/proposal/queries";
import { formatDateTime } from "@/utils/time";

type CampusProposalSummaryProps = {
  academicTermId: string;
  campusCode: string;
  campusName: string;
  campusProposal: CampusProposal | null;
  members: CampusProposalMemberWithFaculty[];
  evaluations: CampusProposalEvaluation[];
};

const lifecycleLabel: Record<ProposalLifecycleStatus, string> = {
  ACTIVE: "Active",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  INVALIDATED: "Invalidated",
};

const lifecycleStyle: Record<ProposalLifecycleStatus, string> = {
  ACTIVE: "bg-amber-100 text-amber-800 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
  INVALIDATED: "bg-slate-100 text-slate-800 border-slate-200",
};

const evaluationStyle: Record<EvaluationStatus, string> = {
  PENDING: "bg-slate-100 text-slate-700 border-slate-200",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
};

const toFixed = (value: number | string | null) => {
  const parsed = Number(value ?? NaN);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "-";
};

const CampusProposalSummary = ({
  academicTermId,
  campusCode,
  campusName,
  campusProposal,
  members,
  evaluations,
}: CampusProposalSummaryProps) => {
  const dfiEvaluation =
    evaluations.find((evaluation) => evaluation.step === "DIRECTOR_FOR_INSTRUCTION") ??
    null;
  const vpaaEvaluation =
    evaluations.find(
      (evaluation) => evaluation.step === "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS",
    ) ?? null;

  const totalAtl = members.reduce(
    (sum, member) => sum + Number(member.actual_teaching_load ?? 0),
    0,
  );
  const totalLecture = members.reduce(
    (sum, member) => sum + Number(member.total_lecture_hours ?? 0),
    0,
  );
  const totalLab = members.reduce(
    (sum, member) => sum + Number(member.total_lab_hours ?? 0),
    0,
  );

  return (
    <Card className="flex min-h-0 flex-col overflow-hidden">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Campus Proposal Summary</CardTitle>
          {campusProposal && (
            <span
              className={`rounded-md border px-2 py-1 text-xs font-medium ${lifecycleStyle[campusProposal.lifecycle_status]}`}
            >
              {lifecycleLabel[campusProposal.lifecycle_status]}
            </span>
          )}
        </div>
        <p className="text-sm text-foreground/80">
          {campusName} ({campusCode}) • Term {academicTermId}
        </p>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        {!campusProposal && (
          <div className="rounded-md border border-dashed p-4 text-sm text-foreground/70">
            No campus proposal found for this campus and term yet.
          </div>
        )}

        {campusProposal && (
          <>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-md border p-2">
                <p className="text-foreground/70">Faculty Count</p>
                <p className="font-semibold">{members.length}</p>
              </div>
              <div className="rounded-md border p-2">
                <p className="text-foreground/70">Total ATL</p>
                <p className="font-semibold">{totalAtl.toFixed(2)}</p>
              </div>
              <div className="rounded-md border p-2">
                <p className="text-foreground/70">Lecture / Lab</p>
                <p className="font-semibold">
                  {totalLecture.toFixed(2)} / {totalLab.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-medium">Director for Instruction</p>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-xs ${evaluationStyle[dfiEvaluation?.status ?? "PENDING"]}`}
                  >
                    {dfiEvaluation?.status ?? "PENDING"}
                  </span>
                </div>
                <p className="text-foreground/70">
                  {dfiEvaluation?.comment ?? "No comment yet."}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-medium">VP for Academic Affairs</p>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-xs ${evaluationStyle[vpaaEvaluation?.status ?? "PENDING"]}`}
                  >
                    {vpaaEvaluation?.status ?? "PENDING"}
                  </span>
                </div>
                <p className="text-foreground/70">
                  {vpaaEvaluation?.comment ?? "No comment yet."}
                </p>
              </div>
            </div>

            <p className="text-xs text-foreground/60">
              Campus proposal created on{" "}
              {formatDateTime(campusProposal.created_at ?? undefined)}.
            </p>

            <table className="w-full rounded-md overflow-hidden text-sm">
              <thead className="sticky top-0 border-b bg-foreground/10">
                <tr className="text-left text-xs">
                  <th className="px-2 py-2">Faculty</th>
                  <th className="px-2 py-2">Employment</th>
                  <th className="px-2 py-2">ATL</th>
                  <th className="px-2 py-2">ETL</th>
                  <th className="px-2 py-2">Lecture</th>
                  <th className="px-2 py-2">Lab</th>
                  <th className="px-2 py-2">Prep</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b">
                    <td className="px-2 py-2">
                      {member.proposal_user?.identity?.name ?? "Unknown Faculty"}
                    </td>
                    <td className="px-2 py-2">{member.employment_status}</td>
                    <td className="px-2 py-2">{toFixed(member.actual_teaching_load)}</td>
                    <td className="px-2 py-2">
                      {toFixed(member.equivalent_teaching_load)}
                    </td>
                    <td className="px-2 py-2">
                      {toFixed(member.total_lecture_hours)}
                    </td>
                    <td className="px-2 py-2">{toFixed(member.total_lab_hours)}</td>
                    <td className="px-2 py-2">{member.preparation_count ?? "-"}</td>
                  </tr>
                ))}

                {members.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-2 py-4 text-center text-foreground/70">
                      No copied individual proposal members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CampusProposalSummary;

