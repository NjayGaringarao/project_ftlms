import { redirect } from "next/navigation";
import { MajorEdit } from "@/components/admin/major-edit";
import { getMajorById } from "@/lib/admin/majors";
import { getProgramById } from "@/lib/admin/programs";

export const dynamic = "force-dynamic";

type EditProgramMajorPageProps = {
  params: Promise<{ id: string; programId: string; majorId: string }>;
};

const EditProgramMajorPage = async ({ params }: EditProgramMajorPageProps) => {
  const { id, programId, majorId } = await params;
  const basePath = `/departments/${id}/programs/${programId}/majors`;
  const [program, major] = await Promise.all([
    getProgramById(programId),
    getMajorById(majorId),
  ]);

  if (
    !program ||
    program.department_id !== id ||
    !major ||
    major.program_id !== programId
  ) {
    redirect(basePath);
  }

  return (
    <div className="flex w-2/3 flex-col">
      <MajorEdit major={major} basePath={basePath} fixedProgramId={programId} />
    </div>
  );
};

export default EditProgramMajorPage;
