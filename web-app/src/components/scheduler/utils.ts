export type ContextKey = "facultyId" | "blockId" | "roomId";
export type SelectedContexts = {
  facultyId?: string | null;
  blockId?: string | null;
  roomId?: string | null;
};

export type MapperQueryParams = {
  academic_term_id: string;
  facultyId?: string;
  blockId?: string;
  roomId?: string;
};

export const getSelectedContextsFromSearchParams = (
  params: Pick<URLSearchParams, "get">,
): SelectedContexts => {
  const facultyId = params.get("facultyId");
  const blockId = params.get("blockId");
  const roomId = params.get("roomId");

  return {
    facultyId,
    blockId,
    roomId,
  };
};
