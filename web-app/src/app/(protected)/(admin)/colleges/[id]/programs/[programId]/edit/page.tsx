import { redirect } from "next/navigation";
import { ProgramEdit } from "@/components/admin/college/program-edit";
import { getProgramById } from "@/lib/admin/programs";

export const dynamic = "force-dynamic";

type EditDepartmentProgramPageProps = {
  params: Promise<{ id: string; programId: string }>;
};

const EditDepartmentProgramPage = async ({
  params,
}: EditDepartmentProgramPageProps) => {
  const { id, programId } = await params;
  const basePath = `/colleges/${id}/programs`;
  const program = await getProgramById(programId);

  if (!program || program.college_id !== id) {
    redirect(basePath);
  }

  return (
    <div className="flex w-full flex-col">
      <ProgramEdit program={program} basePath={basePath} fixedCollegeId={id} />
    </div>
  );
};

export default EditDepartmentProgramPage;
