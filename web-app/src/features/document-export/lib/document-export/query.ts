type QueryValue = string | string[] | undefined;

export const firstQueryParam = (value: QueryValue): string => {
  if (!value) return "";
  return Array.isArray(value) ? (value[0] ?? "") : value;
};

export const queryRecordToSearchParams = (
  query: Record<string, string | string[] | undefined>,
): URLSearchParams => {
  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        searchParams.append(key, item);
      });
      return;
    }
    searchParams.append(key, value);
  });
  return searchParams;
};

export const parseCsvIds = (value: QueryValue): string[] => {
  const raw = firstQueryParam(value).trim();
  if (!raw) return [];

  const seen = new Set<string>();
  const ids: string[] = [];
  raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((id) => {
      if (seen.has(id)) return;
      seen.add(id);
      ids.push(id);
    });

  return ids;
};
