// Categorical series slots in fixed order — assign by position, never cycle.
// Values resolve through globals.css so light/dark swap automatically.
export const CHART_SERIES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

export const CHART_GRID_STROKE = "var(--border)";
export const CHART_AXIS_TICK = {
  fill: "var(--muted-foreground)",
  fontSize: 12,
} as const;

export const DEFAULT_CHART_HEIGHT = 260;

export const formatChartValue = (value: number, decimals = 0): string =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
