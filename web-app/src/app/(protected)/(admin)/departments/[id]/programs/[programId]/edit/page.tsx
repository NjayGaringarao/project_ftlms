import { redirect } from "next/navigation";
import { ProgramEdit } from "@/components/admin/program-edit";
import { getProgramById } from "@/lib/admin/programs";

export const dynamic = "force-dynamic";

type EditDepartmentProgramPageProps = {
  params: Promise<{ id: string; programId: string }>;
};

const EditDepartmentProgramPage = async ({
  params,
}: EditDepartmentProgramPageProps) => {
  const { id, programId } = await params;
  const basePath = `/departments/${id}/programs`;
  const program = await getProgramById(programId);

  if (!program || program.department_id !== id) {
    redirect(basePath);
  }

  return (
    <div className="flex w-2/3 flex-col">
      <ProgramEdit
        program={program}
        basePath={basePath}
        fixedDepartmentId={id}
      />
    </div>
  );
};

export default EditDepartmentProgramPage;
