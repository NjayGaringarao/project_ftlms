import { ArrowDownFromLine, ArrowUpFromLine, Check, User } from "lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CampusLoadDistribution } from "@/lib/proposal/read-models";

const PIE_COLORS = {
  OVERLOAD: "var(--color-red-400)",
  UNDERLOAD: "var(--color-orange-300)",
  NORMAL: "var(--color-green-300)",
} as const;

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
    <div className={`flex flex-col gap-3 rounded-md border p-4 ${containerClassName}`}>
      <p className="text-sm font-medium">{title}</p>
      <div className="flex flex-1 flex-row items-center justify-end gap-3">
        <p className={`text-2xl font-semibold ${valueClassName}`}>{value}</p>
        {icon}
      </div>
    </div>
  );
};

type CampusLoadDistributionOverviewProps = {
  distribution: CampusLoadDistribution;
  emptyStateMessage: string;
};

const CampusLoadDistributionOverview = ({
  distribution,
  emptyStateMessage,
}: CampusLoadDistributionOverviewProps) => {
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

  return (
    <div className="grid min-h-72 grid-cols-5 gap-4">
      <div className="col-span-2 grid grid-cols-2 gap-2 text-sm">
        <LoadInsightCard
          title="Faculty Count"
          value={distribution.total}
          icon={<User className="text-gray-400" />}
          containerClassName="border-gray-200 bg-gray-50"
          valueClassName="text-gray-600"
        />
        <LoadInsightCard
          title="Normal Load"
          value={distribution.normal}
          icon={<Check className="text-green-400" />}
          containerClassName="border-green-200 bg-green-50"
          valueClassName="text-green-600"
        />
        <LoadInsightCard
          title="OverLoad"
          value={distribution.overload}
          icon={<ArrowUpFromLine className="text-red-400" />}
          containerClassName="border-red-200 bg-red-50"
          valueClassName="text-red-600"
        />
        <LoadInsightCard
          title="UnderLoad"
          value={distribution.underload}
          icon={<ArrowDownFromLine className="text-amber-400" />}
          containerClassName="border-amber-200 bg-amber-50"
          valueClassName="text-amber-600"
        />
      </div>

      <div className="col-span-3 rounded-md border p-4">
        {distribution.total === 0 ? (
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
  );
};

export default CampusLoadDistributionOverview;
