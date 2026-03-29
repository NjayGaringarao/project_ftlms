import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FieldView from "@/components/ui/field-view";
import {
  formatProposalDegreeItems,
  formatProposalDesignationItems,
} from "@/lib/load-proposal/snapshot";
import type { UserOverviewReadModel } from "@/lib/user-overview/types";
import type { FacultyLoadProposal } from "@/models";
import { formatDateTime } from "@/utils/time";

type ProposalDetailedSummaryProps = {
  overview: UserOverviewReadModel;
  academicTermCode: string;
  proposal: FacultyLoadProposal | null;
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
    <Card className="flex-1 overflow-hidden">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-base">Proposal Details</CardTitle>
      </CardHeader>
      <CardContent className="text-sm flex-1 overflow-auto">
        <div className="grid grid-cols-1 gap-4">
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
                value={formatProposalDegreeItems(proposal.bachelors_degree, ", ")}
              />
              <FieldView
                label="Master's"
                value={formatProposalDegreeItems(proposal.masters_degree, ", ")}
              />
              <FieldView
                label="Doctorate"
                value={formatProposalDegreeItems(proposal.doctorate_degree, ", ")}
              />
              <FieldView
                label="Designations"
                value={formatProposalDesignationItems(proposal.designations, "; ")}
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

       
      </CardContent>
    </Card>
  );
};

export default ProposalDetailedSummary;
