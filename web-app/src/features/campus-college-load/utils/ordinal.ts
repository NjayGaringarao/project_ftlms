export const formatOrdinalYearLevel = (yearLevel: number | null): string => {
  if (yearLevel === null) return "Unassigned Year Level";

  const dict = ["Zero", "First", "Second", "Third", "Fourth"];
  if (yearLevel >= 0 && yearLevel < dict.length) {
    return `${dict[yearLevel]} Year`;
  }
  return "Unknown Year Level";
};
