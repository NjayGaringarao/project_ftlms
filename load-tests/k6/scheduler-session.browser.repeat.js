import { browser } from "k6/browser";
import { check } from "k6";
import { Trend, Rate } from "k6/metrics";
import exec from "k6/execution";
import { BASE_URL, loadJson } from "./config.js";

const pool = loadJson("../.state/schedule-race-pool.json");
const personas = loadJson("../.state/personas.json");

const REPEAT_ITERATIONS = Number(__ENV.LOAD_TEST_BROWSER_REPEAT_ITERATIONS || 20);

// isTime=true so k6 formats these as durations in the end-of-run summary.
const sessionWriteDuration = new Trend("session_write_ms", true);
const sessionWriteSuccess = new Rate("session_write_success");

// VU=1, repeated many times — a stable single-user baseline for the
// session-creation write, driven through the REAL scheduling UI:
// click an empty grid cell → the confirm dialog opens → click Confirm →
// handleConfirmSchedule() runs the real createSessionFromOffering() Server
// Action, closes the dialog, and refetches the matrices in place. The timed
// window is confirm-click → dialog closed → grid refetch settled, i.e.
// exactly what a real user experiences between "I confirmed" and "the
// updated schedule is on screen". Scheduling context (section, course
// offering, faculty) is supplied via URL params — the same URLSearchParams
// mechanism the app's own picker dialogs write to — so only the genuinely
// interactive parts (cell click, confirm) are automated.
//
// Cell scheme: each iteration clicks a DIFFERENT empty 30-min evening cell
// (rows 24+ = 19:00 onward), cycling 6 days and skipping Friday — the REST
// write-ramp pool occupies Friday evenings — so iterations never conflict
// with each other or with prior pool wins. Offerings round-robin across the
// pool; at 30min per session and 3 lecture units (3h) per pool course, the
// default 20 iterations stay well within both the per-course hour budget
// and the 36 distinct cells this scheme provides.
const SCHEDULE_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Saturday", "Sunday"];
const FIRST_EVENING_ROW = 24; // 19:00 (rows are 30-min slots from 07:00)

export const options = {
  scenarios: {
    scheduler_session_browser_repeat: {
      executor: "shared-iterations",
      vus: 1,
      iterations: REPEAT_ITERATIONS,
      maxDuration: `${Math.max(60, REPEAT_ITERATIONS * 15)}s`,
      options: { browser: { type: "chromium" } },
    },
  },
  thresholds: {
    checks: ["rate==1.0"],
  },
};

export default async function () {
  const iteration = exec.scenario.iterationInTest;
  const race = pool[iteration % pool.length];
  const day = SCHEDULE_DAYS[iteration % SCHEDULE_DAYS.length];
  const row = FIRST_EVENING_ROW + Math.floor(iteration / SCHEDULE_DAYS.length);

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
    await page.waitForLoadState("networkidle").catch(() => {});

    // Open /scheduler with the full scheduling context deep-linked. This and
    // the grid load are untimed setup — a real user would already be sitting
    // on this page before deciding to schedule something.
    const url =
      `${BASE_URL}/scheduler?academic_term_id=${race.academicTermId}` +
      `&sectionId=${race.sectionId}` +
      `&courseUtilizationId=${race.courseUtilizationId}` +
      `&facultyId=${race.facultyUserId}`;
    await page.goto(url, { waitUntil: "networkidle" });

    const grid = page.locator('[data-testid="schedule-mapper-grid"]');
    await grid.waitFor({ state: "visible", timeout: 15000 });
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="schedule-mapper-grid"]');
        return el && el.getAttribute("data-loading") === "false";
      },
      { timeout: 15000 },
    );

    // Click the target empty cell on the Section matrix — mousedown starts a
    // one-slot drag, the window-level mouseup finalizes it and opens the
    // confirm dialog (with context set, no real drag gesture is needed for a
    // single 30-minute slot).
    const cell = page.locator(
      `[data-matrix="Section"][data-day="${day}"][data-row="${row}"]`,
    );
    await cell.click();

    const confirmButton = page.locator('[data-testid="confirm-schedule-button"]');
    const dialogOpened = await confirmButton
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    check(dialogOpened, { "confirm dialog opened": () => dialogOpened });
    if (!dialogOpened) {
      sessionWriteSuccess.add(false);
      return;
    }

    // Timed window: Confirm click → Server Action → dialog closes (Radix
    // unmounts the portal on success; on error it stays open showing the
    // message) → the refreshKey-triggered matrices refetch settles. The
    // dialog's DOM is removed on close, so wait for the confirm button to
    // detach — "hidden" doesn't fire for a portal that unmounts entirely.
    const start = Date.now();
    await confirmButton.click();

    const dialogClosed = await page
      .waitForFunction(
        () => !document.querySelector('[data-testid="confirm-schedule-button"]'),
        { timeout: 15000 },
      )
      .then(() => true)
      .catch(() => false);

    // The refetch flips data-loading to "true" almost immediately after the
    // dialog closes; tolerate missing the brief "true" phase, but always wait
    // for it to settle back to "false".
    await page
      .waitForFunction(
        () => {
          const el = document.querySelector('[data-testid="schedule-mapper-grid"]');
          return el && el.getAttribute("data-loading") === "true";
        },
        { timeout: 2000 },
      )
      .catch(() => {});
    await page
      .waitForFunction(
        () => {
          const el = document.querySelector('[data-testid="schedule-mapper-grid"]');
          return el && el.getAttribute("data-loading") === "false";
        },
        { timeout: 15000 },
      )
      .catch(() => {});

    const elapsedMs = Date.now() - start;
    sessionWriteDuration.add(elapsedMs);
    sessionWriteSuccess.add(dialogClosed);

    check(dialogClosed, {
      "session write confirmed via real UI": () => dialogClosed,
    });
  } finally {
    await page.close();
  }
}
