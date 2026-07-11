import { browser } from "k6/browser";
import { check } from "k6";
import { BASE_URL, loadJson, thresholds, BROWSER_VUS, ITERATIONS } from "./config.js";

const personas = loadJson("../.state/personas.json");

export const options = {
  scenarios: {
    ccl_browser: {
      executor: "shared-iterations",
      vus: BROWSER_VUS,
      iterations: ITERATIONS,
      maxDuration: "60s",
      options: { browser: { type: "chromium" } },
    },
  },
  thresholds: {
    checks: ["rate==1.0"],
    ...thresholds.campusCollegeLoad,
  },
};

const login = async (page, email, password) => {
  await page.goto(`${BASE_URL}/auth/login`);
  await page.locator("#email").type(email);
  await page.locator("#password").type(password);
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
};

// This script verifies the real, authenticated UI renders correctly for both
// roles (Program Chairperson and an evaluator). The DB-write / trigger
// contention load itself is exercised at scale by campus-college-load.rest.js
// via direct PostgREST calls — see load-tests/README.md for why writes aren't
// driven through this browser script (Next.js Server Actions aren't safely
// replayable, and clicking through the submit/evaluate forms at load-test
// volume would create/consume real workflow state that the REST scenario
// already owns).
export default async function () {
  // This k6 version allows only one open browser context per iteration, so
  // both roles are checked on the same page/context — clearing cookies and
  // logging in again in between rather than opening a second context.
  const page = await browser.newPage();
  try {
    await login(page, personas.chair.email, personas.chair.password);
    const chairResponse = await page.goto(`${BASE_URL}/campus-college-load`, {
      waitUntil: "networkidle",
    });
    check(chairResponse, { "chair view loaded": (r) => Boolean(r) && r.status() === 200 });
    const chairHtml = await page.content();
    check(chairHtml, {
      "chair sees Campus College Load page": (html) => html.includes("Campus College Load"),
    });

    await page.context().clearCookies();

    await login(page, personas.campusDirector.email, personas.campusDirector.password);
    const evaluatorResponse = await page.goto(
      `${BASE_URL}/campus-college-load?view=evaluator`,
      { waitUntil: "networkidle" },
    );
    check(evaluatorResponse, { "evaluator view loaded": (r) => Boolean(r) && r.status() === 200 });
    const evaluatorHtml = await page.content();
    check(evaluatorHtml, {
      "evaluator sees Campus College Load page": (html) =>
        html.includes("Campus College Load"),
    });
  } finally {
    await page.close();
  }
}
