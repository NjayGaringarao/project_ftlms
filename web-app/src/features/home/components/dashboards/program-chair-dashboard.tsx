import { getChairInsights } from "@/features/home/lib/chair-queries";
import { DashboardContext } from "@/features/home/lib/types";
import {
  CalendarX2,
  FlaskConical,
  Presentation,
  UserX,
  Users,
} from "lucide-react";
import InsightBarChart from "../charts/bar-chart";
import ChartCard from "../charts/chart-card";
import StatTile from "../charts/stat-tile";
import FtlStatusListCard from "../ftl-status-list-card";

type ProgramChairDashboardProps = {
  context: DashboardContext;
};

const ProgramChairDashboard = async ({
  context,
}: ProgramChairDashboardProps) => {
  const insights = await getChairInsights(context);
  const termLabel = `${context.term!.name} (${context.term!.code})`;
  const topFacultyLoads = insights.facultyLoads.slice(0, 10);

  return (
    <div className="p-6 flex flex-col gap-4 xl:grid xl:grid-cols-2 2xl:grid-cols-3">
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4 xl:col-span-full">
        <StatTile
          label="Sections"
          value={insights.totalSections}
          caption={termLabel}
          icon={Presentation}
        />
        <StatTile
          label="Enrolled Students"
          value={insights.totalStudents}
          caption="Across your sections"
          icon={Users}
        />
        <StatTile
          label="Classes Without Faculty"
          value={insights.unassigned.withoutFaculty}
          caption="Awaiting faculty assignment"
          icon={UserX}
        />
        <StatTile
          label="Unscheduled Classes"
          value={insights.unassigned.withoutSchedule}
          caption="No sessions plotted yet"
          icon={CalendarX2}
        />
      </div>

      <FtlStatusListCard
        title="Faculty Teaching Load Status"
        description="Your campus-college load submissions this term"
        items={insights.ftl}
      />

      <ChartCard
        title="Sections by Year Level"
        description="Section count per year level in your programs"
        empty={insights.sectionsByYearLevel.length === 0}
        emptyLabel="No sections created for this term yet."
      >
        <InsightBarChart
          data={insights.sectionsByYearLevel}
          height={220}
          series={[{ key: "value", name: "Sections" }]}
        />
      </ChartCard>

      <ChartCard
        title="Faculty Teaching Load Distribution"
        description="Actual teaching load per faculty in your sections"
        empty={topFacultyLoads.length === 0}
        emptyLabel="No faculty assigned to classes yet."
      >
        <InsightBarChart
          data={topFacultyLoads}
          horizontal
          decimals={2}
          yAxisWidth={150}
          height={Math.max(200, topFacultyLoads.length * 36 + 40)}
          series={[{ key: "value", name: "ATL" }]}
        />
      </ChartCard>

      <div className="grid gap-4 grid-cols-2 min-w-0">
        <StatTile
          label="Lecture Sessions"
          value={insights.sessionMix.lecture}
          caption="Scheduled this term"
          icon={Presentation}
        />
        <StatTile
          label="Laboratory Sessions"
          value={insights.sessionMix.laboratory}
          caption="Scheduled this term"
          icon={FlaskConical}
        />
        {insights.unassigned.sampleCourseCodes.length > 0 && (
          <p className="text-xs text-foreground/60 sm:col-span-2">
            Needs attention: {insights.unassigned.sampleCourseCodes.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProgramChairDashboard;
