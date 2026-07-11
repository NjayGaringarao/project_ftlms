import http from "k6/http";
import { check } from "k6";
import { BASE_URL, applyCookies, loadJson, thresholds, VUS, DURATION } from "./config.js";

const scope = loadJson("../.state/seed-scope.json");
const session = loadJson("../.state/session.chair.json");

export const options = {
  scenarios: {
    scheduler_rest: {
      executor: "constant-vus",
      vus: VUS,
      duration: DURATION,
    },
  },
  thresholds: thresholds.scheduler,
};

export default function () {
  const jar = http.cookieJar();
  applyCookies(jar, BASE_URL, session.cookies);

  const url =
    `${BASE_URL}/scheduler?academic_term_id=${scope.academicTermId}` +
    `&sectionId=${scope.sectionId}`;
  const res = http.get(url, { jar });

  check(res, {
    "scheduler page 200": (r) => r.status === 200,
    "not redirected to login": (r) => !r.url.includes("/auth/login"),
  });
}
