import { ProgramCreate } from "@/components/admin/college/program-create";

type CreateDepartmentProgramPageProps = {
  params: Promise<{ id: string }>;
};

const CreateDepartmentProgramPage = async ({
  params,
}: CreateDepartmentProgramPageProps) => {
  const { id } = await params;
  const basePath = `/colleges/${id}/programs`;

  return (
    <div className="flex w-1/2 flex-col">
      <ProgramCreate basePath={basePath} fixedCollegeId={id} />
    </div>
  );
};

export default CreateDepartmentProgramPage;
