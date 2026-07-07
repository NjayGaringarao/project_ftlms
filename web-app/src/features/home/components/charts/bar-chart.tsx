"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
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
  payload?: Record<string, unknown>;
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
  // Prefer the row's full label — the axis may be showing the abbreviation.
  const fullLabel = payload[0]?.payload?.label;
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm px-3 py-2 text-sm">
      <p className="font-medium">
        {typeof fullLabel === "string" ? fullLabel : label}
      </p>
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

// Measure rendered label width with a shared canvas so the category axis can
// hug the text instead of reserving a guessed fixed width.
let measureContext: CanvasRenderingContext2D | null = null;
const measureLabel = (text: string, font: string): number => {
  if (typeof document === "undefined") return text.length * 7.5;
  if (!measureContext) {
    measureContext = document.createElement("canvas").getContext("2d");
  }
  if (!measureContext) return text.length * 7.5;
  measureContext.font = font;
  return measureContext.measureText(text).width;
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

  // The container is measured so the category axis can adapt: long labels
  // must not swallow the plot on phones, and short labels must not leave a
  // wide dead gutter on any screen.
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [tickFont, setTickFont] = useState(
    '12px ui-sans-serif, system-ui, sans-serif',
  );
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    setTickFont(`12px ${getComputedStyle(element).fontFamily}`);
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Below this width, rows that provide a shortLabel switch to it —
  // full titles otherwise eat the plot on phones.
  const useShortLabels =
    containerWidth !== null &&
    containerWidth < 480 &&
    data.length > 0 &&
    data.every((row) => typeof row.shortLabel === "string");
  const categoryKey = useShortLabels ? "shortLabel" : labelKey;

  // Size the axis to the widest active label (measured, not guessed) so it
  // hugs the text; yAxisWidth acts only as an upper bound. Labels wider than
  // the container clamp wrap on spaces via recharts.
  const widestLabel = horizontal
    ? Math.max(
        0,
        ...data.map((row) => measureLabel(String(row[categoryKey] ?? ""), tickFont)),
      )
    : 0;
  const effectiveYAxisWidth = Math.max(
    40,
    Math.min(
      Math.ceil(widestLabel) + 12,
      yAxisWidth,
      containerWidth ? Math.round(containerWidth * 0.45) : yAxisWidth,
    ),
  );

  return (
    <div className="min-w-0" ref={containerRef}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{
          top: horizontal ? 8 : 20,
          right: singleSeries ? 40 : 16,
          bottom: 0,
          left: 0,
        }}
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
              dataKey={categoryKey}
              tick={CHART_AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={effectiveYAxisWidth}
              interval={0}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={categoryKey}
              tick={CHART_AXIS_TICK}
              axisLine={false}
              tickLine={false}
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
        {series.map((entry, index) => (
          <Bar
            key={entry.key}
            dataKey={entry.key}
            name={entry.name}
            fill={CHART_SERIES[index % CHART_SERIES.length]}
            maxBarSize={24}
            radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            isAnimationActive={false}
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

      {/* HTML legend instead of recharts <Legend/> — the latter breaks
          ResponsiveContainer's width measurement (chart collapses to 8px). */}
      {!singleSeries && (
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2">
          {series.map((entry, index) => (
            <span
              key={entry.key}
              className="flex items-center gap-1.5 text-xs text-foreground"
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  backgroundColor: CHART_SERIES[index % CHART_SERIES.length],
                }}
              />
              {entry.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default InsightBarChart;
