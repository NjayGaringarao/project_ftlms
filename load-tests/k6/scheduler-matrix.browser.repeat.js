import { browser } from "k6/browser";
import { check } from "k6";
import { Trend, Rate } from "k6/metrics";
import { BASE_URL, loadJson } from "./config.js";

const scope = loadJson("../.state/seed-scope.json");
const personas = loadJson("../.state/personas.json");

const REPEAT_ITERATIONS = Number(__ENV.LOAD_TEST_BROWSER_REPEAT_ITERATIONS || 20);

// isTime=true so k6 formats these as durations in the end-of-run summary.
const matrixLoadDuration = new Trend("matrix_load_ms", true);
const matrixLoadSuccess = new Rate("matrix_load_success");

// VU=1, repeated many times — a stable single-user baseline for the matrix
// query, driven through the REAL page (real "use server" action, real
// client-side hydration, real network stack) rather than the dedicated
// /api/load-test/scheduler-matrices route scheduler-matrix.rest.ramp.js uses to
// make high-VU REST concurrency practical. Compare the two: if this baseline
// and the ramp's VU=10 row disagree wildly, the API route may not be
// representative of the real page's timing.
export const options = {
  scenarios: {
    scheduler_matrix_browser_repeat: {
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
    // Login is a client-side call into a Next.js Server Action that redirects
    // via the App Router (a soft/RSC transition, not a full page navigation),
    // so page.waitForNavigation() never fires. Poll the URL instead.
    await page.locator('button[type="submit"]').click();
    await page.waitForFunction(
      () => !window.location.pathname.startsWith("/auth/login"),
      { timeout: 15000 },
    );
    // The post-login client-side transition (redirect("/home")) can still be
    // in flight here; navigating again immediately can abort it and yield a
    // null response. Let it settle first.
    await page.waitForLoadState("networkidle").catch(() => {});

    // Only time the matrix-load portion — login overhead is excluded so the
    // stable average reflects the query itself, not the fixed cost of
    // authenticating.
    const start = Date.now();

    const url =
      `${BASE_URL}/scheduler?academic_term_id=${scope.academicTermId}` +
      `&sectionId=${scope.sectionId}`;
    const response = await page.goto(url, { waitUntil: "networkidle" });
    const pageOk = Boolean(response) && response.status() === 200;

    const grid = page.locator('[data-testid="schedule-mapper-grid"]');
    await grid.waitFor({ state: "visible", timeout: 15000 });

    // Wait for the RPC-backed fetch to finish (data-loading flips to "false"
    // once get_scheduler_matrices() results have been applied to state).
    await page
      .waitForFunction(
        () => {
          const el = document.querySelector('[data-testid="schedule-mapper-grid"]');
          return el && el.getAttribute("data-loading") === "false";
        },
        { timeout: 15000 },
      )
      .catch(() => {
        // Non-fatal: still record as a failure via the check below.
      });

    const loadingAttr = await grid.getAttribute("data-loading");
    const elapsedMs = Date.now() - start;
    const success = pageOk && loadingAttr === "false";

    matrixLoadDuration.add(elapsedMs);
    matrixLoadSuccess.add(success);

    check(pageOk, { "scheduler page loaded": () => pageOk });
    check(loadingAttr, { "scheduler matrix finished loading": (v) => v === "false" });
  } finally {
    await page.close();
  }
}
