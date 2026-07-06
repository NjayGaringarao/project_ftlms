import { getDeanInsights } from "@/features/home/lib/dean-queries";
import { DashboardContext } from "@/features/home/lib/types";
import { Presentation, Users } from "lucide-react";
import InsightBarChart from "../charts/bar-chart";
import ChartCard from "../charts/chart-card";
import InsightDonutChart from "../charts/donut-chart";
import StatTile from "../charts/stat-tile";
import FtlStatusListCard from "../ftl-status-list-card";

type CollegeDeanDashboardProps = {
  context: DashboardContext;
};

const CollegeDeanDashboard = async ({ context }: CollegeDeanDashboardProps) => {
  const insights = await getDeanInsights(context);
  const termLabel = `${context.term!.name} (${context.term!.code})`;

  return (
    <div className="p-6 flex flex-col gap-4 xl:grid xl:grid-cols-2 2xl:grid-cols-3">
      <div className="grid gap-4 sm:grid-cols-2 xl:col-span-full xl:grid-cols-4">
        <StatTile
          label="Sections"
          value={insights.totalSections}
          caption={termLabel}
          icon={Presentation}
        />
        <StatTile
          label="Enrolled Students"
          value={insights.totalStudents}
          caption="Across your college"
          icon={Users}
        />
      </div>

      <FtlStatusListCard
        title="Load Status per Campus"
        description="Campus-college loads for your college this term"
        items={insights.ftl}
      />

      <ChartCard
        title="Sections per Campus"
        description="Where your college's sections are offered"
        empty={insights.sectionsPerCampus.length === 0}
        emptyLabel="No sections created for this term yet."
      >
        <InsightBarChart
          data={insights.sectionsPerCampus}
          horizontal
          yAxisWidth={90}
          height={Math.max(200, insights.sectionsPerCampus.length * 36 + 40)}
          series={[{ key: "value", name: "Sections" }]}
        />
      </ChartCard>

      <ChartCard
        title="Faculty Employment Mix"
        description="Faculty in your college by employment status"
        empty={insights.employmentMix.length === 0}
        emptyLabel="No faculty assigned to your college yet."
      >
        <InsightDonutChart
          data={insights.employmentMix}
          centerCaption="Faculty"
        />
      </ChartCard>

      <ChartCard
        title="Top Faculty Teaching Loads"
        description="Highest actual teaching loads in your college"
        empty={insights.topFacultyLoads.length === 0}
        emptyLabel="No faculty assigned to classes yet."
      >
        <InsightBarChart
          data={insights.topFacultyLoads}
          horizontal
          decimals={2}
          yAxisWidth={150}
          height={Math.max(200, insights.topFacultyLoads.length * 36 + 40)}
          series={[{ key: "value", name: "ATL" }]}
        />
      </ChartCard>
    </div>
  );
};

export default CollegeDeanDashboard;
