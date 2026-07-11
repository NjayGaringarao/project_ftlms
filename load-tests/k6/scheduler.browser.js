import { browser } from "k6/browser";
import { check } from "k6";
import { BASE_URL, loadJson, thresholds, BROWSER_VUS, ITERATIONS } from "./config.js";

const scope = loadJson("../.state/seed-scope.json");
const personas = loadJson("../.state/personas.json");

export const options = {
  scenarios: {
    scheduler_browser: {
      executor: "shared-iterations",
      vus: BROWSER_VUS,
      iterations: ITERATIONS,
      maxDuration: "60s",
      options: { browser: { type: "chromium" } },
    },
  },
  thresholds: {
    checks: ["rate==1.0"],
    ...thresholds.scheduler,
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

    // Select a real section via query params so ScheduleMapper actually
    // calls get_scheduler_matrices() instead of rendering an empty grid.
    const url =
      `${BASE_URL}/scheduler?academic_term_id=${scope.academicTermId}` +
      `&sectionId=${scope.sectionId}`;
    const response = await page.goto(url, { waitUntil: "networkidle" });
    check(response, { "scheduler page loaded": (r) => Boolean(r) && r.status() === 200 });

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
        // Non-fatal: still record the check below as a failure so it shows
        // up in results, without aborting the whole iteration.
      });

    const loadingAttr = await grid.getAttribute("data-loading");
    check(loadingAttr, { "scheduler matrix finished loading": (v) => v === "false" });
  } finally {
    await page.close();
  }
}
