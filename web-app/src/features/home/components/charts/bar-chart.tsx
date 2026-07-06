"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CHART_AXIS_TICK,
  CHART_GRID_STROKE,
  CHART_SERIES,
  DEFAULT_CHART_HEIGHT,
  formatChartValue,
} from "./chart-tokens";

export type BarSeries = {
  key: string;
  name: string;
};

type InsightBarChartProps = {
  data: Array<Record<string, number | string>>;
  labelKey?: string;
  /** One entry per measure; single-series bars stay in slot 1 (single hue). */
  series?: BarSeries[];
  /** Horizontal bars (categories on the y-axis) — best for long labels. */
  horizontal?: boolean;
  height?: number;
  decimals?: number;
  yAxisWidth?: number;
};

type TooltipEntry = {
  name?: string;
  value?: number | string;
  color?: string;
};

const ChartTooltip = ({
  active,
  payload,
  label,
  decimals,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  decimals: number;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm px-3 py-2 text-sm">
      <p className="font-medium">{label}</p>
      {payload.map((entry, index) => (
        <p
          key={index}
          className="flex items-center gap-2 text-foreground/70"
        >
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name ? `${entry.name}: ` : ""}
          {formatChartValue(Number(entry.value ?? 0), decimals)}
        </p>
      ))}
    </div>
  );
};

const InsightBarChart = ({
  data,
  labelKey = "label",
  series = [{ key: "value", name: "Value" }],
  horizontal = false,
  height = DEFAULT_CHART_HEIGHT,
  decimals = 0,
  yAxisWidth = 120,
}: InsightBarChartProps) => {
  const singleSeries = series.length === 1;
  const valueFormatter = (value: number) =>
    formatChartValue(Number(value), decimals);
  // LabelList's formatter receives RenderableText, not a number.
  const labelFormatter = (label: React.ReactNode) =>
    formatChartValue(Number(label ?? 0), decimals);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 8, right: singleSeries ? 40 : 16, bottom: 0, left: 0 }}
        barGap={2}
      >
        <CartesianGrid
          stroke={CHART_GRID_STROKE}
          horizontal={!horizontal}
          vertical={horizontal}
        />
        {horizontal ? (
          <>
            <XAxis
              type="number"
              tick={CHART_AXIS_TICK}
              tickFormatter={valueFormatter}
              axisLine={false}
              tickLine={false}
              allowDecimals={decimals > 0}
            />
            <YAxis
              type="category"
              dataKey={labelKey}
              tick={CHART_AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={yAxisWidth}
              interval={0}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={labelKey}
              tick={CHART_AXIS_TICK}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={CHART_AXIS_TICK}
              tickFormatter={valueFormatter}
              axisLine={false}
              tickLine={false}
              allowDecimals={decimals > 0}
            />
          </>
        )}
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          content={<ChartTooltip decimals={decimals} />}
        />
        {!singleSeries && (
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span className="text-xs text-foreground">{value}</span>
            )}
          />
        )}
        {series.map((entry, index) => (
          <Bar
            key={entry.key}
            dataKey={entry.key}
            name={entry.name}
            fill={CHART_SERIES[index % CHART_SERIES.length]}
            maxBarSize={24}
            radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          >
            {singleSeries && (
              <LabelList
                dataKey={entry.key}
                position={horizontal ? "right" : "top"}
                formatter={labelFormatter}
                className="fill-muted-foreground"
                fontSize={11}
              />
            )}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default InsightBarChart;
