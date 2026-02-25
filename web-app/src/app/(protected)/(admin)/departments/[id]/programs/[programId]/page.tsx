import { redirect } from "next/navigation";
import { ProgramView } from "@/components/admin/program-view";
import { getProgramById } from "@/lib/admin/programs";

export const dynamic = "force-dynamic";

type ViewDepartmentProgramPageProps = {
  params: Promise<{ id: string; programId: string }>;
};

const ViewDepartmentProgramPage = async ({
  params,
}: ViewDepartmentProgramPageProps) => {
  const { id, programId } = await params;
  const basePath = `/departments/${id}/programs`;
  const majorsPath = `${basePath}/${programId}/majors`;
  const program = await getProgramById(programId);

  if (!program || program.department_id !== id) {
    redirect(basePath);
  }

  return (
    <div className="flex w-2/3 flex-col">
      <ProgramView
        program={program}
        basePath={basePath}
        majorsPath={majorsPath}
      />
    </div>
  );
};

export default ViewDepartmentProgramPage;
