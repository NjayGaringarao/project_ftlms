"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CampusEtlAtlFacultyMetric } from "@/lib/proposal/read-models";
import { ArrowDownFromLine, ArrowUpFromLine, Check, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { computeCampusLoadDistribution } from "@/lib/proposal/derivations";

const PIE_COLORS = {
  OVERLOAD: "var(--color-red-400)",
  UNDERLOAD: "var(--color-orange-300)",
  NORMAL: "var(--color-green-300)",
} as const;

const toFixed = (value: number) => value.toFixed(2);

type CampusLoadInsightsProps = {
  etlAtlPerFaculty: CampusEtlAtlFacultyMetric[];
  proposalFacultyIds: string[];
  approvedFacultyIds: string[];
  campusName: string;
  campusCode: string;
  academicTermCode: string;
};

type LoadInsightCardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
  containerClassName?: string;
  valueClassName?: string;
};

const LoadInsightCard = ({
  title,
  value,
  icon,
  containerClassName,
  valueClassName,
}: LoadInsightCardProps) => {
  return (
    <div
      className={`flex flex-col gap-3 rounded-md border p-4 ${containerClassName}`}
    >
      <p className="text-sm font-medium">{title}</p>
      <div className="flex-1 flex flex-row justify-end items-center gap-3">
        <p className={`text-2xl font-semibold ${valueClassName}`}>{value}</p>
        {icon}
      </div>
    </div>
  );
};

type InsightsFilterMode = "APPROVED" | "ALL";

const CampusLoadInsights = ({
  etlAtlPerFaculty,
  proposalFacultyIds,
  approvedFacultyIds,
  campusName,
  campusCode,
  academicTermCode,
}: CampusLoadInsightsProps) => {
  const [filterMode, setFilterMode] = useState<InsightsFilterMode>("APPROVED");

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
      etlAtlPerFaculty.filter((row) =>
        proposalFacultyIdSet.has(row.faculty_id),
      ),
    [proposalFacultyIdSet, etlAtlPerFaculty],
  );

  const approvedRows = useMemo(
    () =>
      proposalRows.filter((row) => approvedFacultyIdSet.has(row.faculty_id)),
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

  const pieData = [
    {
      label: "Overload",
      value: filteredDistribution.overload,
      color: PIE_COLORS.OVERLOAD,
    },
    {
      label: "Underload",
      value: filteredDistribution.underload,
      color: PIE_COLORS.UNDERLOAD,
    },
    {
      label: "Normal",
      value: filteredDistribution.normal,
      color: PIE_COLORS.NORMAL,
    },
  ];

  const hasLiveFacultyData = filteredDistribution.total > 0;
  const barChartWidth = Math.max(760, filteredRows.length * 88);
  const emptyStateMessage =
    filterMode === "APPROVED"
      ? "No approved individual proposals found for this campus and term."
      : "No current individual proposals found for this campus and term.";

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <CardHeader className="flex flex-row gap-4 items-center justify-between">
        <div className="flex flex-row gap-2 items-center">
          <CardTitle className="text-base">Campus Load Insights</CardTitle>
          <p className="text-sm text-foreground/80">
            ({campusName} Campus - {academicTermCode})
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Button
            type="button"
            size="sm"
            variant={filterMode === "APPROVED" ? "default" : "outline"}
            onClick={() => setFilterMode("APPROVED")}
          >
            Approved Proposals ({approvedDistribution.total})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={filterMode === "ALL" ? "default" : "outline"}
            onClick={() => setFilterMode("ALL")}
          >
            All Proposals ({proposalDistribution.total})
          </Button>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        <div className="grid grid-cols-5 gap-4 min-h-72">
          <div className="grid grid-cols-2 gap-2 text-sm col-span-2">
            <LoadInsightCard
              title="Faculty Count"
              value={filteredDistribution.total}
              icon={<User className="text-gray-400" />}
              containerClassName="bg-gray-50 border-gray-200"
              valueClassName="text-gray-600"
            />
            <LoadInsightCard
              title="Normal Load"
              value={filteredDistribution.normal}
              icon={<Check className="text-green-400" />}
              containerClassName="bg-green-50 border-green-200"
              valueClassName="text-green-600"
            />
            <LoadInsightCard
              title="OverLoad"
              value={filteredDistribution.overload}
              icon={<ArrowUpFromLine className="text-red-400" />}
              containerClassName="bg-red-50 border-red-200"
              valueClassName="text-red-600"
            />
            <LoadInsightCard
              title="UnderLoad"
              value={filteredDistribution.underload}
              icon={<ArrowDownFromLine className="text-amber-400" />}
              containerClassName="bg-amber-50 border-amber-200"
              valueClassName="text-amber-600"
            />
          </div>

          <div className="rounded-md border col-span-3 p-4">
            {!hasLiveFacultyData ? (
              <p className="rounded-md border border-dashed px-3 py-4 text-sm text-foreground/70">
                {emptyStateMessage}
              </p>
            ) : (
              <>
                <p className="mb-2 text-sm font-medium">Load Distribution</p>

                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="label"
                      outerRadius={84}
                      innerRadius={42}
                      paddingAngle={2}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.label} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        </div>

        {!hasLiveFacultyData ? (
          <p className="rounded-md border border-dashed px-3 py-4 text-sm text-foreground/70">
            {emptyStateMessage}
          </p>
        ) : (
          <div className="rounded-md border p-4">
            <p className="mb-2 text-sm font-medium">ETL vs ATL Per Faculty</p>
            <div className="h-80 overflow-x-auto">
              <BarChart
                width={Math.max(256, filteredRows.length * 88)}
                height={320}
                data={filteredRows}
                margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="faculty_name"
                  angle={-28}
                  textAnchor="end"
                  interval={"preserveStartEnd"}
                  height={56}
                  tick={{ fontSize: 10 }}
                  
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => toFixed(Number(value ?? 0))}
                  labelFormatter={(value) => `Faculty: ${value}`}
                  
                />
                <Legend />
                <Bar
                  dataKey="etl"
                  name="ETL"
                  fill="var(--color-blue-400)"
                  radius={[4, 4, 0, 0]}
                  barSize={12}
                />
                <Bar
                  dataKey="atl"
                  name="ATL"
                  fill="var(--color-green-400)"
                  radius={[4, 4, 0, 0]}
                  barSize={12}
                />
              </BarChart>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CampusLoadInsights;
