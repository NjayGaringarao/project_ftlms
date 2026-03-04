export type RowObject = Record<string, unknown>;

export const asObject = (value: unknown): RowObject | null => {
  if (!value) return null;
  if (Array.isArray(value)) {
    const first = value[0];
    return first && typeof first === "object" ? (first as RowObject) : null;
  }
  return typeof value === "object" ? (value as RowObject) : null;
};

export const asString = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
};

export const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
};

export const formatName = (
  firstName: string | null,
  middleName: string | null,
  lastName: string | null,
  extension: string | null,
) => {
  const segments = [firstName, middleName, lastName].filter(Boolean);
  const extensionLabel = extension?.trim();
  const base = segments.join(" ").replace(/\s+/g, " ").trim();

  if (!base) return "Unknown Faculty";
  return extensionLabel ? `${base}, ${extensionLabel}` : base;
};
