import { redirect } from "next/navigation";
import { ProgramOfferingView } from "@/components/admin/program-offering-view";
import { getProgramOfferingById } from "@/lib/admin/program-offerings";

export const dynamic = "force-dynamic";

type ViewCampusProgramOfferingPageProps = {
  params: Promise<{ id: string; offeringId: string }>;
};

const ViewCampusProgramOfferingPage = async ({
  params,
}: ViewCampusProgramOfferingPageProps) => {
  const { id, offeringId } = await params;
  const basePath = `/campuses/${id}/program-offerings`;
  const majorOfferingsPath = `${basePath}/${offeringId}/major-offerings`;
  const offering = await getProgramOfferingById(offeringId);

  if (!offering || offering.campus_id !== id) {
    redirect(basePath);
  }

  return (
    <div className="flex w-2/3 flex-col">
      <ProgramOfferingView
        offering={offering}
        basePath={basePath}
        majorOfferingsPath={majorOfferingsPath}
      />
    </div>
  );
};

export default ViewCampusProgramOfferingPage;
