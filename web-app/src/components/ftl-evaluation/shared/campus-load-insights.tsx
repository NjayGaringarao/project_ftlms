"use client";

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
import type {
  CampusEtlAtlFacultyMetric,
  CampusLoadDistribution,
} from "@/lib/proposal/queries";
import { ArrowDownFromLine, ArrowUpFromLine, Check, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const PIE_COLORS = {
  OVERLOAD: "var(--color-red-400)",
  UNDERLOAD: "var(--color-orange-300)",
  NORMAL: "var(--color-green-300)",
} as const;

const toFixed = (value: number) => value.toFixed(2);

type CampusLoadInsightsProps = {
  distribution: CampusLoadDistribution;
  etlAtlPerFaculty: CampusEtlAtlFacultyMetric[];
};

type LoadInsightCardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
  containerClassName?: string;
};

const LoadInsightCard = ({ title, value, icon, containerClassName }: LoadInsightCardProps) => {
  return (
    <div className={`flex flex-col gap-3 rounded-md border p-4 ${containerClassName}`}>

      <p className="text-sm font-medium">{title}</p>
      <div className="flex-1 flex flex-row justify-end items-center gap-3">
        <p className="text-lg font-semibold">{value}</p>
        {icon}
      </div>
    </div>
  );
};

const CampusLoadInsights = ({
  distribution,
  etlAtlPerFaculty,
}: CampusLoadInsightsProps) => {
  const pieData = [
    {
      label: "Overload",
      value: distribution.overload,
      color: PIE_COLORS.OVERLOAD,
    },
    {
      label: "Underload",
      value: distribution.underload,
      color: PIE_COLORS.UNDERLOAD,
    },
    {
      label: "Normal",
      value: distribution.normal,
      color: PIE_COLORS.NORMAL,
    },
  ];

  const hasLiveFacultyData = distribution.total > 0;
  const barChartWidth = Math.max(760, etlAtlPerFaculty.length * 88);

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <CardHeader className="flex flex-row gap-4 items-center justify-between">
        <CardTitle className="text-base">Campus Load Insights</CardTitle>
        <div className="flex gap-2 text-sm">
          <button className="py-2 px-4">Approved</button>
          <button className="py-2 px-4">All</button>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        <div className="grid grid-cols-5 gap-4 min-h-72">
          <div className="grid grid-cols-2 gap-2 text-sm col-span-2">
            <LoadInsightCard
              title="Faculty Count"
              value={distribution.total}
              icon={<User className="text-gray-400" />}
              containerClassName="bg-gray-50 border-gray-200"
            />
            <LoadInsightCard
              title="Normal Load"
              value={distribution.normal}
              icon={<Check className="text-green-400" />}
              containerClassName="bg-green-50 border-green-200"

            />
            <LoadInsightCard
              title="OverLoad"
              value={distribution.overload}
              icon={<ArrowUpFromLine className="text-red-400" />}
              containerClassName="bg-red-50 border-red-200"
            />
            <LoadInsightCard
              title="UnderLoad"
              value={distribution.underload}
              icon={<ArrowDownFromLine className="text-amber-400" />}
              containerClassName="bg-amber-50 border-amber-200"
            />
          </div>

          <div className="rounded-md border col-span-3 p-4">
            {!hasLiveFacultyData ? (
              <p className="rounded-md border border-dashed px-3 py-4 text-sm text-foreground/70">
                No live faculty load data found for this campus and term.
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
            No live faculty load data found for this campus and term.
          </p>
        ) : (
          <div className="rounded-md border p-3">
            <p className="mb-2 text-sm font-medium">ETL vs ATL Per Faculty</p>
            <div className="overflow-x-auto">
              <BarChart
                width={barChartWidth}
                height={280}
                data={etlAtlPerFaculty}
                margin={{ top: 8, right: 16, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="faculty_name"
                  angle={-28}
                  textAnchor="end"
                  interval={0}
                  height={56}
                  tick={{ fontSize: 11 }}
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
                />
                <Bar
                  dataKey="atl"
                  name="ATL"
                  fill="var(--color-green-400)"
                  radius={[4, 4, 0, 0]}
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
