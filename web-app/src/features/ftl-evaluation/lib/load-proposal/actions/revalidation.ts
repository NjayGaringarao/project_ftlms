import { revalidatePath } from "next/cache";

export const revalidateProposalCollectionsByTerm = (academicTermId: string) => {
  revalidatePath(`/faculty-teaching-load/${academicTermId}`);
  revalidatePath(`/ftl-evaluation/${academicTermId}/campus-load/faculty-load`);
  revalidatePath(
    `/ftl-evaluation/${academicTermId}/campus-load/campus-proposal-control`,
  );
  revalidatePath(`/ftl-evaluation/${academicTermId}/university-load`);
  revalidatePath(`/ftl-evaluation/${academicTermId}`);
};

export const revalidateFacultyProposalWorkspace = (
  academicTermId: string,
  facultyId: string,
) => {
  revalidatePath(`/faculty-teaching-load/${academicTermId}/${facultyId}`);
  revalidatePath(
    `/ftl-evaluation/${academicTermId}/campus-load/faculty-load/${facultyId}`,
  );
};

export const revalidateUniversityCampusWorkspace = (
  academicTermId: string,
  campusId: string,
) => {
  revalidatePath(`/ftl-evaluation/${academicTermId}/university-load/${campusId}`);
};
