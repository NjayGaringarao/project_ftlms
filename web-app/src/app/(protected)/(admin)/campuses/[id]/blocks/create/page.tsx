import { BlockCreate } from "@/components/admin/campus/block-create";

type CreateCampusBlockPageProps = {
  params: Promise<{ id: string }>;
};

const CreateCampusBlockPage = async ({
  params,
}: CreateCampusBlockPageProps) => {
  const { id } = await params;
  const basePath = `/campuses/${id}/blocks`;

  return (
    <div className="flex w-2/3 flex-col">
      <BlockCreate basePath={basePath} fixedCampusId={id} />
    </div>
  );
};

export default CreateCampusBlockPage;
