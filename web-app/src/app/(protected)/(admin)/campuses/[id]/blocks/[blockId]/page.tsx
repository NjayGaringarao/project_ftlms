import { redirect } from "next/navigation";
import { BlockView } from "@/components/admin/block-view";
import { getBlockById } from "@/lib/admin/blocks";

export const dynamic = "force-dynamic";

type ViewCampusBlockPageProps = {
  params: Promise<{ id: string; blockId: string }>;
};

const ViewCampusBlockPage = async ({ params }: ViewCampusBlockPageProps) => {
  const { id, blockId } = await params;
  const basePath = `/campuses/${id}/blocks`;
  const block = await getBlockById(blockId);

  if (!block || block.major_p_c?.program_campus?.campus_id !== id) {
    redirect(basePath);
  }

  return (
    <div className="flex w-2/3 flex-col">
      <BlockView block={block} basePath={basePath} />
    </div>
  );
};

export default ViewCampusBlockPage;
