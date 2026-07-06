import { getExecutiveInsights } from "@/features/home/lib/executive-queries";
import { DashboardContext } from "@/features/home/lib/types";
import type { CampusCollegeLoadStep } from "@/features/shared/types/models/campus_college_load";
import {
  CheckCircle2,
  FileClock,
  FilePen,
  Undo2,
} from "lucide-react";
import ActionListCard from "../action-list-card";
import InsightBarChart from "../charts/bar-chart";
import ChartCard from "../charts/chart-card";
import InsightDonutChart from "../charts/donut-chart";
import StatTile from "../charts/stat-tile";

type ExecutiveDashboardProps = {
  context: DashboardContext;
  step: Extract<
    CampusCollegeLoadStep,
    "DIRECTOR_FOR_INSTRUCTION" | "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS"
  >;
};

const ExecutiveDashboard = async ({ context, step }: ExecutiveDashboardProps) => {
  const insights = await getExecutiveInsights(context.term!.id, step);
  const termLabel = `${context.term!.name} (${context.term!.code})`;
  const hasPipeline = insights.stepCounts.some((entry) => entry.value > 0);

  return (
    <div className="p-6 flex flex-col gap-4 xl:grid xl:grid-cols-2 2xl:grid-cols-3">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:col-span-full">
        <StatTile
          label="Draft Loads"
          value={insights.statusCounts.draft}
          caption={termLabel}
          icon={FilePen}
        />
        <StatTile
          label="Submitted"
          value={insights.statusCounts.submitted}
          caption="In the evaluation pipeline"
          icon={FileClock}
        />
        <StatTile
          label="Returned"
          value={insights.statusCounts.returned}
          caption="Back with Program Chairs"
          icon={Undo2}
        />
        <StatTile
          label="Approved"
          value={insights.statusCounts.approved}
          caption="Completed the full workflow"
          icon={CheckCircle2}
        />
      </div>

      <ActionListCard
        title="Awaiting Your Evaluation"
        description="Submitted campus-college loads at your step"
        items={insights.awaitingEvaluation}
      />

      <ChartCard
        title="Evaluation Pipeline"
        description="Campus-college loads at each workflow step"
        empty={!hasPipeline}
        emptyLabel="No campus-college loads for this term yet."
      >
        <InsightBarChart
          data={insights.stepCounts}
          horizontal
          yAxisWidth={150}
          height={220}
          series={[{ key: "value", name: "Loads" }]}
        />
      </ChartCard>

      <ChartCard
        title="Campus Comparison"
        description="Sections and enrolled students per campus"
        empty={insights.campusComparison.length === 0}
        emptyLabel="No sections created for this term yet."
      >
        <InsightBarChart
          data={insights.campusComparison}
          horizontal
          yAxisWidth={90}
          height={Math.max(220, insights.campusComparison.length * 44 + 60)}
          series={[
            { key: "sections", name: "Sections" },
            { key: "students", name: "Students" },
          ]}
        />
      </ChartCard>

      <ChartCard
        title="University Employment Mix"
        description="All faculty by employment status"
        empty={insights.employmentMix.length === 0}
        emptyLabel="No users recorded yet."
      >
        <InsightDonutChart
          data={insights.employmentMix}
          centerCaption="Faculty"
        />
      </ChartCard>
    </div>
  );
};

export default ExecutiveDashboard;
