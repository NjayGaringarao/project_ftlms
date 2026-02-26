import { ProgramCreate } from "@/components/admin/department/program-create";

type CreateDepartmentProgramPageProps = {
  params: Promise<{ id: string }>;
};

const CreateDepartmentProgramPage = async ({
  params,
}: CreateDepartmentProgramPageProps) => {
  const { id } = await params;
  const basePath = `/departments/${id}/programs`;

  return (
    <div className="flex w-1/2 flex-col">
      <ProgramCreate basePath={basePath} fixedDepartmentId={id} />
    </div>
  );
};

export default CreateDepartmentProgramPage;
