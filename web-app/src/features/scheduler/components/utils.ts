export type ContextKey = "facultyId" | "blockId" | "roomId" | "courseUtilizationId";
export type SelectedContexts = {
  facultyId?: string | null;
  blockId?: string | null;
  roomId?: string | null;
  courseUtilizationId?: string | null;
};

export type MapperQueryParams = {
  academic_term_id: string;
  facultyId?: string;
  blockId?: string;
  roomId?: string;
  courseUtilizationId?: string;
};

export const getSelectedContextsFromSearchParams = (
  params: Pick<URLSearchParams, "get">,
): SelectedContexts => {
  const facultyId = params.get("facultyId");
  const blockId = params.get("blockId");
  const roomId = params.get("roomId");
  const courseUtilizationId = params.get("courseUtilizationId");

  return {
    facultyId,
    blockId,
    roomId,
    courseUtilizationId,
  };
};
