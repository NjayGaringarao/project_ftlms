import { redirect } from "next/navigation";
import { MajorOfferingView } from "@/components/admin/major-offering-view";
import { getMajorOfferingById } from "@/lib/admin/major-offerings";

export const dynamic = "force-dynamic";

type ViewCampusProgramMajorOfferingPageProps = {
  params: Promise<{ id: string; offeringId: string; majorOfferingId: string }>;
};

const ViewCampusProgramMajorOfferingPage = async ({
  params,
}: ViewCampusProgramMajorOfferingPageProps) => {
  const { id, offeringId, majorOfferingId } = await params;
  const basePath = `/campuses/${id}/program-offerings/${offeringId}/major-offerings`;
  const offering = await getMajorOfferingById(majorOfferingId);

  if (
    !offering ||
    offering.program_campus_id !== offeringId ||
    offering.program_campus?.campus_id !== id
  ) {
    redirect(basePath);
  }

  return (
    <div className="flex w-2/3 flex-col">
      <MajorOfferingView offering={offering} basePath={basePath} />
    </div>
  );
};

export default ViewCampusProgramMajorOfferingPage;
