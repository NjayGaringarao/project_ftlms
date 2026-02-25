import { MajorCreate } from "@/components/admin/major-create";

type CreateProgramMajorPageProps = {
  params: Promise<{ id: string; programId: string }>;
};

const CreateProgramMajorPage = async ({
  params,
}: CreateProgramMajorPageProps) => {
  const { id, programId } = await params;
  const basePath = `/departments/${id}/programs/${programId}/majors`;

  return (
    <div className="flex w-2/3 flex-col">
      <MajorCreate basePath={basePath} fixedProgramId={programId} />
    </div>
  );
};

export default CreateProgramMajorPage;
