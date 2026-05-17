export type ContextKey = "facultyId" | "sectionId" | "roomId" | "courseUtilizationId";
export type SelectedContexts = {
  facultyId?: string | null;
  sectionId?: string | null;
  roomId?: string | null;
  courseUtilizationId?: string | null;
};

export type MapperQueryParams = {
  academic_term_id: string;
  facultyId?: string;
  sectionId?: string;
  roomId?: string;
  courseUtilizationId?: string;
};

export const getSelectedContextsFromSearchParams = (
  params: Pick<URLSearchParams, "get">,
): SelectedContexts => {
  const facultyId = params.get("facultyId");
  const sectionId = params.get("sectionId");
  const roomId = params.get("roomId");
  const courseUtilizationId = params.get("courseUtilizationId");

  return {
    facultyId,
    sectionId,
    roomId,
    courseUtilizationId,
  };
};
