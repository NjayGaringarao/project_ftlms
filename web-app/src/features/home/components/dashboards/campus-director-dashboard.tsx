import { getCampusDirectorInsights } from "@/features/home/lib/campus-director-queries";
import { DashboardContext } from "@/features/home/lib/types";
import { Presentation, Users } from "lucide-react";
import InsightBarChart from "../charts/bar-chart";
import ChartCard from "../charts/chart-card";
import InsightDonutChart from "../charts/donut-chart";
import StatTile from "../charts/stat-tile";
import FtlStatusListCard from "../ftl-status-list-card";

type CampusDirectorDashboardProps = {
  context: DashboardContext;
};

const CampusDirectorDashboard = async ({
  context,
}: CampusDirectorDashboardProps) => {
  const insights = await getCampusDirectorInsights(context);
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
          caption="Across your campus"
          icon={Users}
        />
      </div>

      <FtlStatusListCard
        title="Load Pipeline by College"
        description="Campus-college loads on your campus this term"
        items={insights.ftl}
      />

      <ChartCard
        title="Faculty Employment Mix"
        description="Faculty on your campus by employment status"
        empty={insights.employmentMix.length === 0}
        emptyLabel="No faculty assigned to your campus yet."
      >
        <InsightDonutChart
          data={insights.employmentMix}
          centerCaption="Faculty"
        />
      </ChartCard>

      <ChartCard
        title="Room Utilization"
        description="Weekly scheduled hours for the busiest rooms"
        empty={insights.roomUtilization.length === 0}
        emptyLabel="No sessions scheduled in rooms yet."
      >
        <InsightBarChart
          data={insights.roomUtilization}
          horizontal
          decimals={1}
          yAxisWidth={100}
          height={Math.max(200, insights.roomUtilization.length * 36 + 40)}
          series={[{ key: "value", name: "Hours / week" }]}
        />
      </ChartCard>

      <ChartCard
        title="Sections per College"
        description="Section count per college on your campus"
        empty={insights.sectionsPerCollege.length === 0}
        emptyLabel="No sections created for this term yet."
      >
        <InsightBarChart
          data={insights.sectionsPerCollege}
          horizontal
          yAxisWidth={90}
          height={Math.max(200, insights.sectionsPerCollege.length * 36 + 40)}
          series={[{ key: "value", name: "Sections" }]}
        />
      </ChartCard>
    </div>
  );
};

export default CampusDirectorDashboard;
