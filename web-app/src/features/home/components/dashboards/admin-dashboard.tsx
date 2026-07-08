import { getAdminInsights } from "@/features/home/lib/admin-queries";
import { KeyRound, LogIn, MailCheck, Users } from "lucide-react";
import InsightBarChart from "../charts/bar-chart";
import ChartCard from "../charts/chart-card";
import InsightDonutChart from "../charts/donut-chart";
import StatTile from "../charts/stat-tile";

// Horizontal bar charts grow with their category count so labels never collide.
const barHeight = (count: number) => Math.max(200, count * 36 + 40);

const AdminDashboard = async () => {
  const insights = await getAdminInsights();

  return (
    <div className="p-6 flex flex-col gap-4 xl:grid xl:grid-cols-2 2xl:grid-cols-3">
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4 xl:col-span-full">
        <StatTile
          label="Total Users"
          value={insights.accountHealth.totalUsers}
          caption="Registered accounts"
          icon={Users}
        />
        <StatTile
          label="Confirmed Emails"
          value={insights.accountHealth.confirmedEmails}
          caption={`of ${insights.accountHealth.totalUsers} accounts`}
          icon={MailCheck}
        />
        <StatTile
          label="Active This Week"
          value={insights.accountHealth.signIns7d}
          caption="Signed in within 7 days"
          icon={LogIn}
        />
        <StatTile
          label="Active This Month"
          value={insights.accountHealth.signIns30d}
          caption="Signed in within 30 days"
          icon={KeyRound}
        />
      </div>

      <ChartCard
        title="User Employment Status"
        description="All registered users by employment status"
        empty={insights.employmentMix.length === 0}
        emptyLabel="No users recorded yet."
      >
        <InsightDonutChart
          data={insights.employmentMix}
          centerCaption="Users"
        />
      </ChartCard>

      <ChartCard
        title="Users per Campus"
        description="Where faculty are distributed across the university"
        empty={insights.usersPerCampus.length === 0}
        emptyLabel="No users assigned to a campus yet."
      >
        <InsightBarChart
          data={insights.usersPerCampus}
          horizontal
          yAxisWidth={90}
          height={barHeight(insights.usersPerCampus.length)}
          series={[{ key: "value", name: "Users" }]}
        />
      </ChartCard>

      <ChartCard
        title="Academic Rank Distribution"
        description="Faculty count per academic rank"
        empty={insights.rankDistribution.length === 0}
        emptyLabel="No academic ranks assigned yet."
      >
        <InsightBarChart
          data={insights.rankDistribution}
          horizontal
          yAxisWidth={150}
          height={barHeight(insights.rankDistribution.length)}
          series={[{ key: "value", name: "Faculty" }]}
        />
      </ChartCard>

      <ChartCard
        title="Leadership Designations"
        description="Users holding each leadership designation"
        empty={insights.leadershipBreakdown.length === 0}
        emptyLabel="No designations recorded yet."
      >
        <InsightBarChart
          data={insights.leadershipBreakdown}
          horizontal
          yAxisWidth={190}
          height={barHeight(insights.leadershipBreakdown.length)}
          series={[{ key: "value", name: "Users" }]}
        />
      </ChartCard>
    </div>
  );
};

export default AdminDashboard;
