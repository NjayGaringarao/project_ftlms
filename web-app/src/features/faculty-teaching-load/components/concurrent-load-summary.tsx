import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FieldView from "@/components/ui/field-view";
import type { UserDataReadModel } from "@/features/profile/lib/user-data/types";
import {
  formatProposalDegreeItems,
  formatProposalDesignationItems,
  type FacultyLoadSnapshot,
} from "@/features/ftl-evaluation/lib/load-proposal/snapshot";

type ConcurrentLoadSummaryProps = {
  userData: UserDataReadModel;
  academicTermCode: string;
  snapshot: FacultyLoadSnapshot;
};

const toFixed = (value: number | string | null) => {
  const parsed = Number(value ?? NaN);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "-";
};

const ConcurrentLoadSummary = ({
  userData,
  academicTermCode,
  snapshot,
}: ConcurrentLoadSummaryProps) => {
  const facultyName = userData.identity?.name ?? "Unknown Faculty";
  const campusName = userData.campus?.name ?? "No campus assigned";
  const collegeName = userData.college?.name ?? "No college assigned";

  return (
    <Card className="flex-1 overflow-hidden">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-base">Concurrent Load Details</CardTitle>
      </CardHeader>
      <CardContent className="text-sm flex-1 overflow-auto">
        <div className="grid grid-cols-1 gap-4">
          <FieldView label="Faculty" value={facultyName} />
          <FieldView label="Campus" value={campusName} />
          <FieldView label="College" value={collegeName} />
          <FieldView label="Academic Term" value={academicTermCode} />

          <FieldView label="Employment" value={snapshot.employment_status ?? "-"} />
          <FieldView label="Rank" value={snapshot.academic_rank ?? "-"} />
          <FieldView
            label="Bachelor's"
            value={formatProposalDegreeItems(snapshot.bachelors_degree, ", ")}
          />
          <FieldView
            label="Master's"
            value={formatProposalDegreeItems(snapshot.masters_degree, ", ")}
          />
          <FieldView
            label="Doctorate"
            value={formatProposalDegreeItems(snapshot.doctorate_degree, ", ")}
          />
          <FieldView
            label="Designations"
            value={formatProposalDesignationItems(snapshot.designations, "; ")}
          />

          <div className="grid grid-cols-2 gap-4">
            <FieldView label="ETL" value={toFixed(snapshot.equivalent_teaching_load)} />
            <FieldView label="ATL" value={toFixed(snapshot.actual_teaching_load)} />
            <FieldView
              label="Lecture Hours"
              value={toFixed(snapshot.total_lecture_hours)}
            />
            <FieldView label="Lab Hours" value={toFixed(snapshot.total_lab_hours)} />
            <FieldView
              label="Preparations"
              value={String(snapshot.preparation_count ?? "-")}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConcurrentLoadSummary;
