"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_SERIES, formatChartValue } from "./chart-tokens";

export type DonutDatum = {
  label: string;
  value: number;
};

type InsightDonutChartProps = {
  data: DonutDatum[];
  height?: number;
  centerCaption?: string;
};

const MAX_SLICES = 5;

// Fixed slot order caps at 5 hues — everything past slot 4 folds into "Other".
const foldExtraSlices = (data: DonutDatum[]): DonutDatum[] => {
  if (data.length <= MAX_SLICES) return data;
  const sorted = [...data].sort((left, right) => right.value - left.value);
  const kept = sorted.slice(0, MAX_SLICES - 1);
  const other = sorted
    .slice(MAX_SLICES - 1)
    .reduce((sum, entry) => sum + entry.value, 0);
  return [...kept, { label: "Other", value: other }];
};

const DonutTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string }>;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm px-3 py-2 text-sm">
      <p className="font-medium">{payload[0].name}</p>
      <p className="text-foreground/70">
        {formatChartValue(Number(payload[0].value ?? 0))}
      </p>
    </div>
  );
};

const InsightDonutChart = ({
  data,
  height = 220,
  centerCaption = "Total",
}: InsightDonutChartProps) => {
  const slices = foldExtraSlices(data.filter((entry) => entry.value > 0));
  const total = slices.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="88%"
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((entry, index) => (
                <Cell
                  key={entry.label}
                  fill={CHART_SERIES[index % CHART_SERIES.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-3xl font-semibold">{formatChartValue(total)}</p>
          <p className="text-xs text-foreground/60">{centerCaption}</p>
        </div>
      </div>

      {/* Direct values in the legend keep identity readable even where a hue
          sits below 3:1 contrast on the light surface. */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
        {slices.map((entry, index) => (
          <li
            key={entry.label}
            className="flex items-center gap-2 text-sm min-w-0"
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                backgroundColor: CHART_SERIES[index % CHART_SERIES.length],
              }}
            />
            <span className="truncate">{entry.label}</span>
            <span className="ml-auto text-foreground/60">
              {formatChartValue(entry.value)}
              {total > 0 && (
                <span className="ml-1">
                  ({Math.round((entry.value / total) * 100)}%)
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InsightDonutChart;
