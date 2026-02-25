import { redirect } from "next/navigation";
import { MajorOfferingView } from "@/components/admin/major-offering-view";
import { getMajorOfferingById } from "@/lib/admin/major-offerings";

export const dynamic = "force-dynamic";

type ViewPageProps = {
  params: Promise<{ id: string }>;
};

const ViewPage = async ({ params }: ViewPageProps) => {
  const { id } = await params;
  const offering = await getMajorOfferingById(id);

  if (!offering) {
    redirect("/major-offerings");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <MajorOfferingView offering={offering} />
    </div>
  );
};

export default ViewPage;
