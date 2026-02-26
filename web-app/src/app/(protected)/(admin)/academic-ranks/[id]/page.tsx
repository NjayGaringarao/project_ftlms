import { redirect } from "next/navigation";
import { RankView } from "@/components/admin/rank-view";
import { getRankById } from "@/lib/admin/ranks";

export const dynamic = "force-dynamic";

type ViewPageProps = {
  params: Promise<{ id: string }>;
};

const ViewPage = async ({ params }: ViewPageProps) => {
  const { id } = await params;
  const rank = await getRankById(id);

  if (!rank) {
    redirect("/academic-ranks");
  }

  return (
    <div className="flex w-1/3 flex-col">
      <RankView rank={rank} />
    </div>
  );
};

export default ViewPage;
