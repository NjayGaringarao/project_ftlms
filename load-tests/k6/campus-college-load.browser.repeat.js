import { browser } from "k6/browser";
import { check } from "k6";
import { Trend, Rate } from "k6/metrics";
import { BASE_URL, loadJson } from "./config.js";

const personas = loadJson("../.state/personas.json");

const REPEAT_ITERATIONS = Number(__ENV.LOAD_TEST_BROWSER_REPEAT_ITERATIONS || 20);

// isTime=true so k6 formats these as durations in the end-of-run summary.
const cclLoadDuration = new Trend("ccl_load_ms", true);
const cclLoadSuccess = new Rate("ccl_load_success");

// VU=1, repeated many times — a stable single-user baseline for the
// campus-college-load list page, driven through the REAL page (real
// authenticated navigation, real network stack) rather than k6's plain http
// module (see campus-college-load.rest.ramp.js). Unlike the scheduler page,
// this page's data (getUserRole/getTermsListCached/getCampusCollegeLoadList/
// getCampusCollegeLoadDetail) is fetched server-side inside a Suspense
// boundary — there's no separate client-side fetch to wait out, so the
// presence of the [data-testid="campus-college-load-content"] element (vs.
// the ListDetailSkeleton fallback) is itself the "fully loaded" signal.
// Chair view only, matching the scope of campus-college-load.rest.ramp.js's
// chair-session GET — compare the two the same way the scheduler pair is
// compared.
export const options = {
  scenarios: {
    ccl_browser_repeat: {
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

    // Only time the CCL page load — login overhead is excluded so the stable
    // average reflects the page's own server-side data-fetching cost, not the
    // fixed cost of authenticating.
    const start = Date.now();

    const response = await page.goto(`${BASE_URL}/campus-college-load`, {
      waitUntil: "networkidle",
    });
    const pageOk = Boolean(response) && response.status() === 200;

    const content = page.locator('[data-testid="campus-college-load-content"]');
    const loaded = await content
      .waitFor({ state: "visible", timeout: 15000 })
      .then(() => true)
      .catch(() => false);

    const elapsedMs = Date.now() - start;
    const success = pageOk && loaded;

    cclLoadDuration.add(elapsedMs);
    cclLoadSuccess.add(success);

    check(pageOk, { "campus-college-load page loaded": () => pageOk });
    check(loaded, { "campus-college-load content rendered": () => loaded });
  } finally {
    await page.close();
  }
}
