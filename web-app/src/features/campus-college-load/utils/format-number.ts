const numberFormat = new Intl.NumberFormat("en", {
  maximumFractionDigits: 2,
});

export const formatNumber = (value: unknown): string => {
  const parsed = Number(value ?? 0);
  return numberFormat.format(Number.isFinite(parsed) ? parsed : 0);
};
