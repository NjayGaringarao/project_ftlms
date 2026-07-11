import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

const scriptsDir = dirname(dirname(fileURLToPath(import.meta.url)));
const CSV_PATH = join(scriptsDir, "..", "base_users.csv");

export type CsvUserRow = {
  role: "ADMIN" | "USER";
  email: string;
  password: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  professionalExtension: string;
  address: string;
  designation: string;
  campusName: string;
  collegeCode: string;
};

const REQUIRED_HEADERS = [
  "ROLE",
  "EMAIL",
  "PASSWORD",
  "FIRST NAME",
  "MIDDLE NAME",
  "LAST NAME",
  "SUFFIX",
  "PROFESSIONAL EXTENSION",
  "ADDRESS",
  "DESIGNATION",
  "CAMPUS",
  "COLLEGE",
];

export const loadCsvUsers = (): CsvUserRow[] => {
  let raw: string;
  try {
    raw = readFileSync(CSV_PATH, "utf-8");
  } catch {
    throw new Error(
      `Could not read ${CSV_PATH}. Save your base users CSV there (see load-tests/README.md).`,
    );
  }

  // The provided export has a couple of blank/title rows before the real
  // header row, and a leading UTF-8 BOM — strip both rather than assuming a
  // fixed line count.
  const withoutBom = raw.replace(/^﻿/, "");
  const lines = withoutBom.split(/\r?\n/);
  const headerLineIndex = lines.findIndex((line) => line.trim().startsWith("ROLE,"));
  if (headerLineIndex === -1) {
    throw new Error(`Could not find a "ROLE,..." header row in ${CSV_PATH}.`);
  }
  const csvBody = lines.slice(headerLineIndex).join("\n");

  const records: Record<string, string>[] = parse(csvBody, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  for (const header of REQUIRED_HEADERS) {
    if (!(header in (records[0] ?? {}))) {
      throw new Error(`${CSV_PATH} is missing expected column "${header}".`);
    }
  }

  return records
    .filter((record) => (record.EMAIL ?? "").trim().length > 0)
    .map((record) => {
      const role = record.ROLE?.trim().toUpperCase();
      if (role !== "ADMIN" && role !== "USER") {
        throw new Error(`Unrecognized ROLE "${record.ROLE}" for ${record.EMAIL} in ${CSV_PATH}.`);
      }
      return {
        role,
        email: record.EMAIL.trim(),
        password: record.PASSWORD.trim(),
        firstName: record["FIRST NAME"]?.trim() ?? "",
        middleName: record["MIDDLE NAME"]?.trim() ?? "",
        lastName: record["LAST NAME"]?.trim() ?? "",
        suffix: record.SUFFIX?.trim() ?? "",
        professionalExtension: record["PROFESSIONAL EXTENSION"]?.trim() ?? "",
        address: record.ADDRESS?.trim() ?? "",
        designation: record.DESIGNATION?.trim() ?? "",
        campusName: record.CAMPUS?.trim() ?? "",
        collegeCode: record.COLLEGE?.trim() ?? "",
      } satisfies CsvUserRow;
    });
};
