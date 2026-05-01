export const getCreatedRecordId = (
  data: boolean | { id: string } | undefined,
) => (typeof data === "object" && data !== null ? data.id : null);
