import { revalidatePath } from "next/cache";

export type MutationError = {
  code?: string;
  message?: string;
};

export const normalizeCode = (value: string) => value.trim();
export const normalizeName = (value: string) => value.trim();
export const normalizeDescription = (value?: string | null) =>
  value?.trim() || null;

export const mapDuplicateError = (
  entity: string,
  fieldLabel: string,
  error: MutationError,
) => {
  if (error.code === "23505") {
    return `${entity} ${fieldLabel} already exists`;
  }

  return error.message ?? "Unexpected error";
};

export const mapCollegeMutationError = (error: MutationError) => {
  if (error.code === "23505") {
    const message = error.message?.toLowerCase() ?? "";
    if (message.includes("code")) {
      return "College code already exists";
    }
    if (message.includes("name")) {
      return "College name already exists";
    }
    return "College already exists";
  }

  return error.message ?? "Unexpected error";
};

export const mapCourseMutationError = (error: MutationError) => {
  if (error.code === "23505") {
    const message = error.message?.toLowerCase() ?? "";
    if (message.includes("code")) {
      return "Course code already exists";
    }
    return "Course already exists";
  }

  return error.message ?? "Unexpected error";
};

export const revalidateCollegesPaths = (id?: string) => {
  revalidatePath("/colleges");
  revalidatePath("/colleges/create");

  if (id) {
    revalidatePath(`/colleges/${id}`);
    revalidatePath(`/colleges/${id}/edit`);
  }
};

export const revalidateCampusesPaths = (id?: string) => {
  revalidatePath("/campuses");
  revalidatePath("/campuses/create");

  if (id) {
    revalidatePath(`/campuses/${id}`);
    revalidatePath(`/campuses/${id}/edit`);
  }
};

export const revalidateTermsPaths = (yearId?: string) => {
  revalidatePath("/academic-calendar");

  if (yearId) {
    revalidatePath(`/academic-calendar/${yearId}`);
    revalidatePath(`/academic-calendar/${yearId}/edit`);
  }
};

export const revalidateAcademicYearsPaths = (id?: string) => {
  revalidatePath("/academic-calendar");
  revalidatePath("/academic-calendar/create");

  if (id) {
    revalidatePath(`/academic-calendar/${id}`);
    revalidatePath(`/academic-calendar/${id}/edit`);
  }
};

export const revalidateRanksPaths = (id?: string) => {
  revalidatePath("/academic-ranks");
  revalidatePath("/academic-ranks/create");

  if (id) {
    revalidatePath(`/academic-ranks/${id}`);
    revalidatePath(`/academic-ranks/${id}/edit`);
  }
};

export const revalidateCoursesPaths = (id?: string) => {
  revalidatePath("/courses");
  revalidatePath("/courses/create");

  if (id) {
    revalidatePath(`/courses/${id}`);
    revalidatePath(`/courses/${id}/edit`);
  }
};

export const revalidateProgramsPaths = (id?: string) => {
  revalidatePath("/programs");
  revalidatePath("/programs/create");

  if (id) {
    revalidatePath(`/programs/${id}`);
    revalidatePath(`/programs/${id}/edit`);
  }
};

export const revalidateProgramOfferingsPaths = (id?: string) => {
  revalidatePath("/program-offerings");
  revalidatePath("/program-offerings/create");

  if (id) {
    revalidatePath(`/program-offerings/${id}`);
    revalidatePath(`/program-offerings/${id}/edit`);
  }
};

export const revalidateMajorsPaths = (id?: string) => {
  revalidatePath("/majors");
  revalidatePath("/majors/create");

  if (id) {
    revalidatePath(`/majors/${id}`);
    revalidatePath(`/majors/${id}/edit`);
  }
};

export const revalidateMajorOfferingsPaths = (id?: string) => {
  revalidatePath("/major-offerings");
  revalidatePath("/major-offerings/create");

  if (id) {
    revalidatePath(`/major-offerings/${id}`);
    revalidatePath(`/major-offerings/${id}/edit`);
  }
};

export const revalidateBlocksPaths = () => {
  revalidatePath("/blocks");
};

export const revalidateDepartmentProgramsPaths = (
  departmentId: string,
  programId?: string,
) => {
  const basePath = `/colleges/${departmentId}/programs`;
  revalidatePath(basePath);
  revalidatePath(`${basePath}/create`);

  if (programId) {
    revalidatePath(`${basePath}/${programId}`);
    revalidatePath(`${basePath}/${programId}/edit`);
    revalidatePath(`${basePath}/${programId}/majors`);
    revalidatePath(`${basePath}/${programId}/majors/create`);
  }
};

export const revalidateProgramMajorsPaths = (
  departmentId: string,
  programId: string,
  majorId?: string,
) => {
  const basePath = `/colleges/${departmentId}/programs/${programId}/majors`;
  revalidatePath(basePath);
  revalidatePath(`${basePath}/create`);

  if (majorId) {
    revalidatePath(`${basePath}/${majorId}`);
    revalidatePath(`${basePath}/${majorId}/edit`);
  }
};

export const revalidateDepartmentProgramDetailPath = (
  departmentId: string,
  programId: string,
) => {
  const basePath = `/colleges/${departmentId}/programs`;
  revalidatePath(basePath);
  revalidatePath(`${basePath}/${programId}`);
  revalidatePath(`${basePath}/${programId}/edit`);
};

export const revalidateCampusProgramMajorOfferingsPaths = (
  campusId: string,
  programOfferingId: string,
  majorOfferingId?: string,
) => {
  const basePath = `/campuses/${campusId}/program-offerings/${programOfferingId}/major-offerings`;
  revalidatePath(basePath);
  revalidatePath(`${basePath}/create`);

  if (majorOfferingId) {
    revalidatePath(`${basePath}/${majorOfferingId}`);
    revalidatePath(`${basePath}/${majorOfferingId}/edit`);
  }
};

export const revalidateCampusProgramOfferingDetailPath = (
  campusId: string,
  programOfferingId: string,
) => {
  const basePath = `/campuses/${campusId}/program-offerings`;
  revalidatePath(basePath);
  revalidatePath(`${basePath}/${programOfferingId}`);
  revalidatePath(`${basePath}/${programOfferingId}/edit`);
};

export const revalidateCampusRoomsPaths = (campusId: string, roomId?: string) => {
  const basePath = `/campuses/${campusId}/rooms`;
  revalidatePath(basePath);
  revalidatePath(`${basePath}/create`);

  if (roomId) {
    revalidatePath(`${basePath}/${roomId}`);
    revalidatePath(`${basePath}/${roomId}/edit`);
  }
};
