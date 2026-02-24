import { redirect } from "next/navigation";
import { RankEditForm } from "@/components/university/rank-edit-form";
import { getRankById } from "@/lib/university/ranks";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

const EditPage = async ({ params }: EditPageProps) => {
  const { id } = await params;
  const rank = await getRankById(id);

  if (!rank) {
    redirect("/university/ranks");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <RankEditForm rank={rank} />
    </div>
  );
};

export default EditPage;
