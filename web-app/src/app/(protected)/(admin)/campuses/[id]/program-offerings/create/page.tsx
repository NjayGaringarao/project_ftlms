import { ProgramOfferingCreate } from "@/components/admin/program-offering-create";

type CreateCampusProgramOfferingPageProps = {
  params: Promise<{ id: string }>;
};

const CreateCampusProgramOfferingPage = async ({
  params,
}: CreateCampusProgramOfferingPageProps) => {
  const { id } = await params;
  const basePath = `/campuses/${id}/program-offerings`;

  return (
    <div className="flex w-2/3 flex-col">
      <ProgramOfferingCreate basePath={basePath} fixedCampusId={id} />
    </div>
  );
};

export default CreateCampusProgramOfferingPage;
