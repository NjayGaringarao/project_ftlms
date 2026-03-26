import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FieldView from "@/components/ui/field-view";
import type { UserOverviewReadModel } from "@/lib/user-overview/types";
import type { Proposal, ProposalLifecycleStatus } from "@/models";
import { formatDateTime } from "@/utils/time";

type ProposalDetailedSummaryProps = {
  overview: UserOverviewReadModel;
  academicTermCode: string;
  proposal: Proposal | null;
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

const toFixed = (value: number | string | null) => {
  const parsed = Number(value ?? NaN);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "-";
};

const ProposalDetailedSummary = ({
  overview,
  academicTermCode,
  proposal,
}: ProposalDetailedSummaryProps) => {
  const facultyName = overview.identity?.name ?? "Unknown Faculty";
  const campusName = overview.campus?.name ?? "No campus assigned";
  const collegeName = overview.college?.name ?? "No college assigned";

  return (
    <Card className="h-full">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-base">Proposal Summary</CardTitle>
        {proposal && (
          <span
            className={`rounded-md border px-2 py-1 text-xs font-medium ${lifecycleStyle[proposal.lifecycle_status]}`}
          >
            {lifecycleLabel[proposal.lifecycle_status]}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4 text-sm overflow-y-auto">
        <div className="flex flex-col gap-4">
          <FieldView label="Faculty" value={facultyName} />
          <FieldView label="Campus" value={campusName} />
          <FieldView label="College" value={collegeName} />
          <FieldView label="Academic Term" value={academicTermCode} />

          {proposal && (
            <>
              <FieldView
                label="Employment"
                value={proposal.employment_status}
              />
              <FieldView label="Rank" value={proposal.academic_rank ?? "-"} />
              <FieldView
                label="Bachelor's"
                value={proposal.bachelors_degree ?? "-"}
              />
              <FieldView
                label="Master's"
                value={proposal.masters_degree ?? "-"}
              />
              <FieldView
                label="Doctorate"
                value={proposal.doctorate_degree ?? "-"}
              />
              <FieldView
                label="Designations"
                value={proposal.designations ?? "-"}
              />

              <div className="grid grid-cols-2 gap-4">
                <FieldView
                  label="ETL"
                  value={toFixed(proposal.equivalent_teaching_load)}
                />
                <FieldView
                  label="ATL"
                  value={toFixed(proposal.actual_teaching_load)}
                />
                <FieldView
                  label="Lecture Hours"
                  value={toFixed(proposal.total_lecture_hours)}
                />
                <FieldView
                  label="Lab Hours"
                  value={toFixed(proposal.total_lab_hours)}
                />
                <FieldView
                  label="Preparations"
                  value={String(proposal.preparation_count ?? "-")}
                />
              </div>
              <FieldView
                label="Created At"
                value={formatDateTime(proposal.created_at ?? undefined)}
              />
            </>
          )}
        </div>

        {!proposal && (
          <div className="rounded-md border border-dashed p-4 text-foreground/70">
            No proposal yet for this faculty in the selected term.
          </div>
        )}

        {proposal &&
          proposal.lifecycle_status === "INVALIDATED" &&
          proposal.invalidated_reason && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900">
              Invalidated reason: {proposal.invalidated_reason}
            </div>
          )}
      </CardContent>
    </Card>
  );
};

export default ProposalDetailedSummary;
