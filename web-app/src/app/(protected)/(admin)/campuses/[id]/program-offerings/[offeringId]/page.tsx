import { redirect } from "next/navigation";
import { ProgramOfferingView } from "@/features/admin/components/campus/program-offering-view";
import { getProgramOfferingById } from "@/features/admin/lib/program-offerings";

export const dynamic = "force-dynamic";

type ViewCampusProgramOfferingPageProps = {
  params: Promise<{ id: string; offeringId: string }>;
};

const ViewCampusProgramOfferingPage = async ({
  params,
}: ViewCampusProgramOfferingPageProps) => {
  const { id, offeringId } = await params;
  const basePath = `/campuses/${id}/program-offerings`;
  const offering = await getProgramOfferingById(offeringId);

  if (!offering || offering.campus_id !== id) {
    redirect(basePath);
  }

  return (
    <div className="flex w-1/2 flex-col">
      <ProgramOfferingView offering={offering} basePath={basePath} />
    </div>
  );
};

export default ViewCampusProgramOfferingPage;
