import { redirect } from "next/navigation";
import { BlockView } from "@/components/admin/campus/block-view";
import { getBlockById } from "@/lib/admin/blocks";

export const dynamic = "force-dynamic";

type ViewCampusBlockPageProps = {
  params: Promise<{ id: string; blockId: string }>;
};

const ViewCampusBlockPage = async ({ params }: ViewCampusBlockPageProps) => {
  const { id, blockId } = await params;
  const basePath = `/campuses/${id}/blocks`;
  const block = await getBlockById(blockId);

  if (!block || block.major_offering?.program_offering?.campus_id !== id) {
    redirect(basePath);
  }

  return (
    <div className="flex w-1/2 flex-col">
      <BlockView block={block} basePath={basePath} />
    </div>
  );
};

export default ViewCampusBlockPage;
