import assert from "node:assert/strict";
import test from "node:test";
import { getFacultyScheduleWarnings } from "./faculty-schedule-warnings.ts";

const session = (startMinute, endMinute, overrides = {}) => ({
  day: "Monday",
  startMinute,
  endMinute,
  ...overrides,
});

test("8 AM to 11 AM followed by 11 AM to 2 PM warns for lunch and six continuous hours", () => {
  assert.deepEqual(
    getFacultyScheduleWarnings([session(480, 660)], session(660, 840)),
    [
      { code: "no-lunch-break" },
      { code: "continuous-teaching", startMinute: 480, endMinute: 840 },
    ],
  );
});

test("a full lunch hour starting at 10 AM qualifies", () => {
  assert.deepEqual(
    getFacultyScheduleWarnings([session(480, 600)], session(660, 840)),
    [],
  );
});

test("a full lunch hour ending at 2 PM qualifies", () => {
  assert.deepEqual(getFacultyScheduleWarnings([], session(600, 780)), []);
});

test("a lunch hour crossing the 2 PM boundary does not qualify", () => {
  assert.deepEqual(getFacultyScheduleWarnings([], session(600, 810)), [
    { code: "no-lunch-break" },
  ]);
});

test("a lunch hour crossing the 10 AM boundary does not qualify", () => {
  assert.deepEqual(getFacultyScheduleWarnings([], session(630, 840)), [
    { code: "no-lunch-break" },
  ]);
});

test("a 30-minute gap breaks continuity but is too short for lunch", () => {
  assert.deepEqual(
    getFacultyScheduleWarnings([session(480, 690)], session(720, 840)),
    [{ code: "no-lunch-break" }],
  );
});

test("a full 60-minute gap is a valid lunch break", () => {
  assert.deepEqual(
    getFacultyScheduleWarnings([session(480, 660)], session(720, 840)),
    [],
  );
});

test("separate 30-minute gaps cannot be combined into a lunch hour", () => {
  assert.deepEqual(
    getFacultyScheduleWarnings(
      [session(600, 660), session(690, 750)],
      session(780, 840),
    ),
    [{ code: "no-lunch-break" }],
  );
});

test("six continuous hours trigger even when a lunch hour is available", () => {
  assert.deepEqual(
    getFacultyScheduleWarnings([session(840, 1020)], session(1020, 1200)),
    [{ code: "continuous-teaching", startMinute: 840, endMinute: 1200 }],
  );
});

test("five and a half continuous hours do not trigger the six-hour warning", () => {
  assert.deepEqual(
    getFacultyScheduleWarnings([session(840, 1020)], session(1020, 1170)),
    [],
  );
});

test("overlapping and duplicate sessions are merged without double counting", () => {
  const existing = [
    session(600, 720),
    session(480, 660, { id: "duplicate" }),
    session(480, 660, { id: "duplicate" }),
  ];
  assert.deepEqual(
    getFacultyScheduleWarnings(existing, session(720, 810)),
    [{ code: "no-lunch-break" }],
  );
  assert.deepEqual(
    getFacultyScheduleWarnings(existing, session(720, 840)),
    [
      { code: "no-lunch-break" },
      { code: "continuous-teaching", startMinute: 480, endMinute: 840 },
    ],
  );
});

test("sessions on other weekdays do not affect the candidate", () => {
  assert.deepEqual(
    getFacultyScheduleWarnings(
      [session(480, 840)],
      session(660, 840, { day: "Tuesday" }),
    ),
    [],
  );
});

test("moving a session replaces its original time", () => {
  assert.deepEqual(
    getFacultyScheduleWarnings(
      [session(480, 660), session(660, 840, { id: "moving" })],
      session(840, 1020, { id: "moving" }),
      "moving",
    ),
    [],
  );
});

test("moving to another weekday considers the destination day's sessions", () => {
  assert.deepEqual(
    getFacultyScheduleWarnings(
      [
        session(480, 840, { id: "moving" }),
        session(480, 660, { day: "Tuesday" }),
      ],
      session(660, 840, { id: "moving", day: "Tuesday" }),
      "moving",
    ),
    [
      { code: "no-lunch-break" },
      { code: "continuous-teaching", startMinute: 480, endMinute: 840 },
    ],
  );
});

test("an unrelated existing long run does not warn for a separate candidate", () => {
  assert.deepEqual(
    getFacultyScheduleWarnings([session(840, 1200)], session(480, 540)),
    [],
  );
});

test("invalid existing intervals are ignored", () => {
  assert.deepEqual(
    getFacultyScheduleWarnings(
      [session(NaN, 840), session(600, Infinity), session(840, 600), session(600, 600)],
      session(600, 780),
    ),
    [],
  );
});

test("an invalid candidate produces no warnings", () => {
  for (const candidate of [
    session(NaN, 840),
    session(600, Infinity),
    session(840, 600),
    session(600, 600),
  ]) {
    assert.deepEqual(
      getFacultyScheduleWarnings([session(480, 840)], candidate),
      [],
    );
  }
});

test("warning evaluation does not mutate the source sessions", () => {
  const existing = [session(660, 840), session(480, 660)];
  const original = structuredClone(existing);
  getFacultyScheduleWarnings(existing, session(840, 900));
  assert.deepEqual(existing, original);
});
