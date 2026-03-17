export type ContextKey = "facultyId" | "blockId" | "roomId";
export type ActiveContext = { key: ContextKey; value: string } | null;

export const getActiveContextFromSearchParams = (
  params: Pick<URLSearchParams, "get">,
): ActiveContext => {
  const facultyId = params.get("facultyId");
  const blockId = params.get("blockId");
  const roomId = params.get("roomId");

  const activeCount =
    Number(Boolean(facultyId)) +
    Number(Boolean(blockId)) +
    Number(Boolean(roomId));

  if (activeCount !== 1) return null;
  if (facultyId) return { key: "facultyId", value: facultyId };
  if (blockId) return { key: "blockId", value: blockId };
  if (roomId) return { key: "roomId", value: roomId };
  return null;
};