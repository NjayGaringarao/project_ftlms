import { readFileSync, writeFileSync } from "node:fs";
import "dotenv/config";

type Point = {
  metric: string;
  type: string;
  data: { time: string; value: number; tags?: Record<string, string> };
};

type Row = {
  vuLevel: number;
  requests: number;
  errorRatePct: number;
  avgMs: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
  minMs: number;
  maxMs: number;
  approxReqPerSec: number;
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

const main = () => {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error(
      "Usage: tsx scripts/analyze-ramp-results.ts <path-to-k6-json-output>\n" +
        "(produced by `k6 run --out json=<path> ...` — the loadtest:*:ramp npm scripts already do this)",
    );
    process.exit(1);
  }

  const allowedLevels = (process.env.LOAD_TEST_RAMP_TARGETS || "10,25,50,75,100")
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isFinite(v));

  const durationsByLevel = new Map<number, number[]>();
  const failuresByLevel = new Map<number, number[]>();
  const timesByLevel = new Map<number, number[]>();

  const lines = readFileSync(filePath, "utf-8").trim().split("\n");
  for (const line of lines) {
    if (!line) continue;
    const point: Point = JSON.parse(line);
    if (point.type !== "Point") continue;
    const rawLevel = point.data.tags?.vu_level;
    if (rawLevel === undefined) continue;
    const level = Number(rawLevel);
    if (!allowedLevels.includes(level)) continue;

    const time = new Date(point.data.time).getTime();

    if (point.metric === "http_req_duration") {
      if (!durationsByLevel.has(level)) durationsByLevel.set(level, []);
      durationsByLevel.get(level)!.push(point.data.value);
      if (!timesByLevel.has(level)) timesByLevel.set(level, []);
      timesByLevel.get(level)!.push(time);
    } else if (point.metric === "http_req_failed") {
      if (!failuresByLevel.has(level)) failuresByLevel.set(level, []);
      failuresByLevel.get(level)!.push(point.data.value);
    }
  }

  const rows: Row[] = [...durationsByLevel.keys()]
    .sort((a, b) => a - b)
    .map((level) => {
      const durations = [...durationsByLevel.get(level)!].sort((a, b) => a - b);
      const failures = failuresByLevel.get(level) ?? [];
      const times = timesByLevel.get(level) ?? [];
      const spanSeconds = times.length > 1 ? (Math.max(...times) - Math.min(...times)) / 1000 : 0;

      return {
        vuLevel: level,
        requests: durations.length,
        errorRatePct: round(
          failures.length > 0 ? (100 * failures.reduce((a, b) => a + b, 0)) / failures.length : 0,
          2,
        ),
        avgMs: round(durations.reduce((a, b) => a + b, 0) / durations.length),
        p50Ms: round(percentile(durations, 50)),
        p90Ms: round(percentile(durations, 90)),
        p95Ms: round(percentile(durations, 95)),
        p99Ms: round(percentile(durations, 99)),
        minMs: round(durations[0]),
        maxMs: round(durations[durations.length - 1]),
        approxReqPerSec: round(spanSeconds > 0 ? durations.length / spanSeconds : durations.length),
      };
    });

  if (rows.length === 0) {
    console.error(
      `No tagged data points found in ${filePath} matching vu_level in [${allowedLevels.join(", ")}]. ` +
        "Did the run actually use one of the k6/*.rest.ramp.js scripts?",
    );
    process.exit(1);
  }

  console.table(
    rows.map((row) => ({
      VUs: row.vuLevel,
      Requests: row.requests,
      "Errors %": row.errorRatePct,
      "Avg ms": row.avgMs,
      "P50 ms": row.p50Ms,
      "P90 ms": row.p90Ms,
      "P95 ms": row.p95Ms,
      "P99 ms": row.p99Ms,
      "Min ms": row.minMs,
      "Max ms": row.maxMs,
      "~Req/s": row.approxReqPerSec,
    })),
  );

  const csvPath = filePath.replace(/\.json$/, ".csv");
  const header = "vu,requests,error_rate_pct,avg_ms,p50_ms,p90_ms,p95_ms,p99_ms,min_ms,max_ms,approx_req_per_sec";
  const csvRows = rows.map((row) =>
    [
      row.vuLevel,
      row.requests,
      row.errorRatePct,
      row.avgMs,
      row.p50Ms,
      row.p90Ms,
      row.p95Ms,
      row.p99Ms,
      row.minMs,
      row.maxMs,
      row.approxReqPerSec,
    ].join(","),
  );
  writeFileSync(csvPath, [header, ...csvRows].join("\n") + "\n", "utf-8");
  console.log(`Wrote ${csvPath}`);
};

main();
