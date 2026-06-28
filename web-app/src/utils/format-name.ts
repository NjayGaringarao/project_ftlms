export type NameParts = {
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  suffix?: string | null;
  professional_extension?: string | null;
};

/**
 * Controls which name component appears first.
 * - LAST: "DELA CRUZ, JUAN C. JR." (formal list / roster order)
 * - FIRST: "JUAN C. DELA CRUZ JR." (natural reading order)
 */
export type FirstWordOption = "LAST" | "FIRST";

/**
 * Controls how the middle name is rendered.
 * - FULL: the entire middle name as stored ("MARIE")
 * - INITIAL: first character followed by a period ("M.")
 */
export type MiddleNameOption = "FULL" | "INITIAL";

export interface FormatNameOptions {
  /** Which name comes first. Defaults to "LAST". */
  firstWord?: FirstWordOption;
  /** Full middle name or initial only. Defaults to "FULL". */
  middleName?: MiddleNameOption;
  /** Whether to append the professional extension (e.g. "Ph.D."). Defaults to true. */
  isProfexIncluded?: boolean;
}

/**
 * Flexible name formatter.
 *
 * Examples:
 *   formatName(identity, { firstWord: "FIRST", middleName: "INITIAL", isProfexIncluded: true })
 *   → "NEMIA M. GALANG, Ph.D."
 *
 *   formatName(identity, { firstWord: "LAST", middleName: "FULL", isProfexIncluded: true })
 *   → "GALANG, NEMIA MARIE JR., Ph.D."
 */
export function formatName(
  identity: NameParts | null | undefined,
  options: FormatNameOptions = {},
): string | null {
  if (!identity) return null;

  const {
    firstWord = "LAST",
    middleName = "FULL",
    isProfexIncluded = true,
  } = options;

  const first = identity.first_name?.trim() || null;
  const last = identity.last_name?.trim() || null;
  const suffix = identity.suffix?.trim() || null;
  const profExt = isProfexIncluded
    ? (identity.professional_extension?.trim() || null)
    : null;

  const rawMiddle = identity.middle_name?.trim() || null;
  const middle = rawMiddle
    ? middleName === "INITIAL"
      ? `${rawMiddle[0]}.`
      : rawMiddle
    : null;

  if (!first && !last) return null;

  let mainName: string;
  if (firstWord === "FIRST") {
    // Natural order: FIRST [MI./MIDDLE] LAST [SUFFIX]
    mainName = [first, middle, last, suffix].filter(Boolean).join(" ");
  } else {
    // Roster order: LAST, FIRST [MI./MIDDLE] [SUFFIX]
    const afterLast = [first, middle, suffix].filter(Boolean).join(" ");
    mainName = last
      ? afterLast
        ? `${last}, ${afterLast}`
        : last
      : afterLast;
  }

  return profExt ? `${mainName}, ${profExt}` : mainName || null;
}

/**
 * Formats a name in roster order with the full middle name.
 * e.g. "DELA CRUZ, JUAN CARLOS JR., Ph.D."
 *
 * Drop-in replacement for the original formatFullName — behavior is identical.
 */
export function formatFullName(identity: NameParts | null | undefined): string | null {
  return formatName(identity, {
    firstWord: "LAST",
    middleName: "FULL",
    isProfexIncluded: true,
  });
}

/** Derives two-letter initials from a structured name, falling back to the given string. */
export function nameInitials(
  identity: NameParts | null | undefined,
  fallback?: string,
): string {
  const first = identity?.first_name?.trim();
  const last = identity?.last_name?.trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  if (last) return last.slice(0, 2).toUpperCase();
  return (fallback ?? "U").slice(0, 2).toUpperCase();
}
