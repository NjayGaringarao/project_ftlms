import { browser } from "k6/browser";
import { check } from "k6";
import { Trend, Rate } from "k6/metrics";
import exec from "k6/execution";
import { BASE_URL, loadJson } from "./config.js";

const pool = loadJson("../.state/schedule-race-pool.json");
const personas = loadJson("../.state/personas.json");

const REPEAT_ITERATIONS = Number(__ENV.LOAD_TEST_BROWSER_REPEAT_ITERATIONS || 20);

const sessionWriteDuration = new Trend("session_write_ms", true);
const sessionWriteSuccess = new Rate("session_write_success"); // 201 or 409 both count as "handled cleanly"

// VU=1, repeated many times — a stable single-user baseline for the
// session-creation write, driven from a real authenticated browser page
// (real cookies, real network stack) rather than k6's plain http module.
// The write itself goes through /api/load-test/schedule-session via
// fetch() from inside the page — NOT a literal drag-and-drop simulation on
// the schedule grid. That keeps this robust to automate while still
// exercising the real app layer (auth, createSessionFromOffering()) through
// a real browser context; see scheduler-session.rest.ramp.js for the same
// route driven at up to 150 concurrent VUs via plain HTTP instead.
export const options = {
  scenarios: {
    scheduler_session_browser_repeat: {
      executor: "shared-iterations",
      vus: 1,
      iterations: REPEAT_ITERATIONS,
      maxDuration: `${Math.max(60, REPEAT_ITERATIONS * 10)}s`,
      options: { browser: { type: "chromium" } },
    },
  },
  thresholds: {
    checks: ["rate==1.0"],
  },
};

export default async function () {
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE_URL}/auth/login`);
    await page.locator("#email").type(personas.chair.email);
    await page.locator("#password").type(personas.chair.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForFunction(
      () => !window.location.pathname.startsWith("/auth/login"),
      { timeout: 15000 },
    );
    await page.waitForLoadState("networkidle").catch(() => {});

    const race = pool[exec.scenario.iterationInTest % pool.length];

    const start = Date.now();
    const result = await page.evaluate(
      async ({ url, body }) => {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        return { status: res.status };
      },
      {
        url: `${BASE_URL}/api/load-test/schedule-session`,
        body: {
          academicTermId: race.academicTermId,
          sectionId: race.sectionId,
          courseUtilizationId: race.courseUtilizationId,
          facultyId: race.facultyUserId,
          roomId: race.roomId,
          day: race.day,
          startTime: race.startTime,
          endTime: race.endTime,
          type: "Lecture",
        },
      },
    );
    const elapsedMs = Date.now() - start;
    const success = result.status === 201 || result.status === 409;

    sessionWriteDuration.add(elapsedMs);
    sessionWriteSuccess.add(success);

    check(result, {
      "schedule-session via browser 201 or 409": () => success,
      "schedule-session via browser never 5xx": () => result.status < 500,
    });
  } finally {
    await page.close();
  }
}
