// Maps the free-text DESIGNATION column from base_users.csv to the actual
// designation_title_enum value plus the scope the DB's check/uniqueness
// constraints require for it (see supabase/migrations/305_constraints_designation.sql
// and 503_triggers_designation_uniqueness.sql). Patterns are matched by
// prefix against the CSV's own labels, not derived generically — they're
// deliberately explicit so an unrecognized designation fails loudly instead
// of being silently misclassified.

export type DesignationClassification =
  | { kind: "none" }
  | { kind: "program-chair"; jobTitle: "Program Chairperson"; programCode: string }
  | { kind: "campus-scoped"; jobTitle: string }
  | { kind: "global"; jobTitle: string };

const GLOBAL_TITLES: Record<string, string> = {
  "DIRECTOR FOR INSTRUCTION": "Director for Instruction",
  "VICE PRESIDENT FOR ACADEMIC AFFAIRS": "Vice President for Academic Affairs",
  "QUALITY ASSURANCE": "Quality Assurance",
};

export const classifyDesignation = (raw: string): DesignationClassification => {
  const text = raw.trim();
  if (!text) return { kind: "none" };
  const upper = text.toUpperCase();

  if (upper.startsWith("PROGRAM CHAIR")) {
    const programCode = upper.split(/\s+/).pop();
    if (!programCode) {
      throw new Error(`Could not parse a trailing program code from designation "${raw}".`);
    }
    return { kind: "program-chair", jobTitle: "Program Chairperson", programCode };
  }

  if (upper.startsWith("CAMPUS DIRECTOR")) {
    return { kind: "campus-scoped", jobTitle: "Campus Director" };
  }

  if (upper.startsWith("CAMPUS FACULTY PRESIDENT")) {
    return { kind: "campus-scoped", jobTitle: "Campus Faculty President" };
  }

  if (upper in GLOBAL_TITLES) {
    return { kind: "global", jobTitle: GLOBAL_TITLES[upper] };
  }

  throw new Error(
    `Unrecognized DESIGNATION "${raw}" — add a pattern for it in ` +
      `load-tests/scripts/lib/designation-parser.ts.`,
  );
};
