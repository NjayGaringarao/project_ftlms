"use client";

import { useMemo, useState } from "react";
import type { CampusEtlAtlFacultyMetric } from "@/lib/load-proposal/read-models";
import { computeCampusLoadDistribution } from "@/lib/load-proposal/derivations";
import { Card, CardContent } from "@/components/ui/card";
import FacultyLoadScopeExportActions from "@/components/ftl-evaluation/shared/faculty-load-scope-export-actions";
import CampusLoadInsightsHeader, {
  type CampusLoadInsightsFilterMode,
} from "@/components/ftl-evaluation/shared/campus-load-insights-header";
import CampusLoadDistributionOverview from "@/components/ftl-evaluation/shared/campus-load-distribution-overview";
import CampusLoadEtlAtlChart from "@/components/ftl-evaluation/shared/campus-load-etl-atl-chart";
import CampusLoadFacultyTable from "@/components/ftl-evaluation/shared/campus-load-faculty-table";

type CampusLoadInsightsProps = {
  etlAtlPerFaculty: CampusEtlAtlFacultyMetric[];
  proposalFacultyIds: string[];
  approvedFacultyIds: string[];
  campusName: string;
  campusCode: string;
  academicTermCode: string;
  academicTermId: string;
  campusId: string;
};

const CampusLoadInsights = ({
  etlAtlPerFaculty,
  proposalFacultyIds,
  approvedFacultyIds,
  campusName,
  campusCode,
  academicTermCode,
  academicTermId,
  campusId,
}: CampusLoadInsightsProps) => {
  const [filterMode, setFilterMode] =
    useState<CampusLoadInsightsFilterMode>("APPROVED");

  const proposalFacultyIdSet = useMemo(
    () => new Set(proposalFacultyIds),
    [proposalFacultyIds],
  );
  const approvedFacultyIdSet = useMemo(
    () => new Set(approvedFacultyIds),
    [approvedFacultyIds],
  );

  const proposalRows = useMemo(
    () =>
      etlAtlPerFaculty.filter((row) => proposalFacultyIdSet.has(row.faculty_id)),
    [proposalFacultyIdSet, etlAtlPerFaculty],
  );
  const approvedRows = useMemo(
    () => proposalRows.filter((row) => approvedFacultyIdSet.has(row.faculty_id)),
    [approvedFacultyIdSet, proposalRows],
  );

  const proposalDistribution = useMemo(
    () => computeCampusLoadDistribution(proposalRows),
    [proposalRows],
  );
  const approvedDistribution = useMemo(
    () => computeCampusLoadDistribution(approvedRows),
    [approvedRows],
  );

  const filteredRows = filterMode === "APPROVED" ? approvedRows : proposalRows;
  const filteredDistribution =
    filterMode === "APPROVED" ? approvedDistribution : proposalDistribution;

  const emptyStateMessage =
    filterMode === "APPROVED"
      ? "No approved individual proposals found for this campus and term."
      : "No current individual proposals found for this campus and term.";

  const exportableCount =
    filterMode === "APPROVED"
      ? approvedDistribution.total
      : proposalDistribution.total;

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <CampusLoadInsightsHeader
        campusName={campusName}
        campusCode={campusCode}
        academicTermCode={academicTermCode}
        filterMode={filterMode}
        approvedCount={approvedDistribution.total}
        allCount={proposalDistribution.total}
        onFilterModeChange={setFilterMode}
        exportActions={
          <FacultyLoadScopeExportActions
            academicTermId={academicTermId}
            scope={{
              kind: "campus_insights",
              campusId,
              mode: filterMode,
            }}
            exportableCount={exportableCount}
            disabledReason={
              exportableCount > 0
                ? undefined
                : "No exportable faculty found for the selected insights mode."
            }
            triggerLabel="Export FTL"
            triggerClassName="h-9 px-3"
          />
        }
      />

      <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        <CampusLoadDistributionOverview
          distribution={filteredDistribution}
          emptyStateMessage={emptyStateMessage}
        />

        {filteredDistribution.total === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-4 text-sm text-foreground/70">
            {emptyStateMessage}
          </p>
        ) : (
          <>
            <CampusLoadEtlAtlChart rows={filteredRows} />
            <CampusLoadFacultyTable
              rows={filteredRows}
              emptyStateMessage={emptyStateMessage}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CampusLoadInsights;
