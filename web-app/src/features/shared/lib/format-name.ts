type NameParts = {
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  suffix?: string | null;
  professional_extension?: string | null;
};

/**
 * Formats a structured name into display form: "LAST, FIRST MIDDLE SUFFIX, PROFEXT"
 * e.g. "DELA CRUZ, JUAN CARLOS JR., PhD"
 */
export function formatFullName(identity: NameParts | null | undefined): string | null {
  if (!identity) return null;

  const last = identity.last_name?.trim();
  const first = identity.first_name?.trim();
  const middle = identity.middle_name?.trim();
  const suffix = identity.suffix?.trim();
  const profExt = identity.professional_extension?.trim();

  if (!last && !first) return null;

  const afterLast = [first, middle, suffix].filter(Boolean).join(" ");
  const mainName = last
    ? afterLast
      ? `${last}, ${afterLast}`
      : last
    : afterLast;

  return profExt ? `${mainName}, ${profExt}` : mainName || null;
}

/** Derives two-letter initials from a structured name, falling back to the given string. */
export function nameInitials(identity: NameParts | null | undefined, fallback?: string): string {
  const first = identity?.first_name?.trim();
  const last = identity?.last_name?.trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  if (last) return last.slice(0, 2).toUpperCase();
  return (fallback ?? "U").slice(0, 2).toUpperCase();
}
