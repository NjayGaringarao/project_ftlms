import { redirect } from "next/navigation";
import { RankEdit } from "@/components/admin/rank-edit";
import { getRankById } from "@/lib/admin/ranks";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

const EditPage = async ({ params }: EditPageProps) => {
  const { id } = await params;
  const rank = await getRankById(id);

  if (!rank) {
    redirect("/academic-ranks");
  }

  return (
    <div className="flex w-1/3 flex-col">
      <RankEdit rank={rank} />
    </div>
  );
};

export default EditPage;
