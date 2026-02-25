import { redirect } from "next/navigation";
import { ProgramOfferingView } from "@/components/admin/program-offering-view";
import { getProgramOfferingById } from "@/lib/admin/program-offerings";

export const dynamic = "force-dynamic";

type ViewPageProps = {
  params: Promise<{ id: string }>;
};

const ViewPage = async ({ params }: ViewPageProps) => {
  const { id } = await params;
  const offering = await getProgramOfferingById(id);

  if (!offering) {
    redirect("/program-offerings");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <ProgramOfferingView offering={offering} />
    </div>
  );
};

export default ViewPage;
