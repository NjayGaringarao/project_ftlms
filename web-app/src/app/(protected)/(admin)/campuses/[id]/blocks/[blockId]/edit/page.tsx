import { redirect } from "next/navigation";
import { BlockEdit } from "@/components/admin/block-edit";
import { getBlockById } from "@/lib/admin/blocks";

export const dynamic = "force-dynamic";

type EditCampusBlockPageProps = {
  params: Promise<{ id: string; blockId: string }>;
};

const EditCampusBlockPage = async ({ params }: EditCampusBlockPageProps) => {
  const { id, blockId } = await params;
  const basePath = `/campuses/${id}/blocks`;
  const block = await getBlockById(blockId);

  if (!block || block.major_p_c?.program_campus?.campus_id !== id) {
    redirect(basePath);
  }

  return (
    <div className="flex w-2/3 flex-col">
      <BlockEdit block={block} basePath={basePath} fixedCampusId={id} />
    </div>
  );
};

export default EditCampusBlockPage;
