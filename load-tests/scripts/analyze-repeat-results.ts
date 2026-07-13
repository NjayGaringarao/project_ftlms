import { createReadStream, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import "dotenv/config";

type Point = {
  metric: string;
  type: string;
  data: { time: string; value: number; tags?: Record<string, string> };
};

const percentile = (sorted: number[], p: number): number => {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[index];
};

const round = (value: number, decimals = 1): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

// Summarizes a *.browser.repeat.js run (VU=1, N iterations) into a single
// stable-average row, reading the custom Trend metric each script records
// (matrix_load_ms / session_write_ms) rather than http_req_duration — browser
// scripts don't populate that (no plain k6/http calls), and login overhead
// is deliberately excluded from the timed window at the k6-script level.
const main = async () => {
  const [filePath, metricName, successMetricName] = process.argv.slice(2);
  if (!filePath || !metricName) {
    console.error(
      "Usage: tsx scripts/analyze-repeat-results.ts <path-to-k6-json-output> <metric-name> [success-rate-metric-name]\n" +
        "(produced by k6 run --out json=<path> ... against one of the *.browser.repeat.js scripts)",
    );
    process.exit(1);
  }

  const durations: number[] = [];
  const successes: number[] = [];

  const rl = createInterface({
    input: createReadStream(filePath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line) continue;
    const point: Point = JSON.parse(line);
    if (point.type !== "Point") continue;
    if (point.metric === metricName) {
      durations.push(point.data.value);
    } else if (successMetricName && point.metric === successMetricName) {
      successes.push(point.data.value);
    }
  }

  if (durations.length === 0) {
    console.error(`No data points found for metric "${metricName}" in ${filePath}.`);
    process.exit(1);
  }

  const sorted = [...durations].sort((a, b) => a - b);
  const successRatePct =
    successes.length > 0
      ? round((100 * successes.reduce((a, b) => a + b, 0)) / successes.length, 2)
      : null;

  const row: Record<string, number> = {
    VUs: 1,
    Requests: durations.length,
    ...(successRatePct !== null ? { "Success %": successRatePct } : {}),
    "Avg ms": round(durations.reduce((a, b) => a + b, 0) / durations.length),
    "P50 ms": round(percentile(sorted, 50)),
    "P90 ms": round(percentile(sorted, 90)),
    "P95 ms": round(percentile(sorted, 95)),
    "P99 ms": round(percentile(sorted, 99)),
    "Min ms": round(sorted[0]),
    "Max ms": round(sorted[sorted.length - 1]),
  };

  console.table([row]);

  const csvPath = filePath.replace(/\.json$/, ".csv");
  const header = Object.keys(row).join(",");
  const values = Object.values(row).join(",");
  writeFileSync(csvPath, `${header}\n${values}\n`, "utf-8");
  console.log(`Wrote ${csvPath}`);
};

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
