import { redirect } from "next/navigation";
import { MajorOfferingCreate } from "@/components/admin/major-offering-create";
import { getProgramOfferingById } from "@/lib/admin/program-offerings";

type CreateCampusProgramMajorOfferingPageProps = {
  params: Promise<{ id: string; offeringId: string }>;
};

const CreateCampusProgramMajorOfferingPage = async ({
  params,
}: CreateCampusProgramMajorOfferingPageProps) => {
  const { id, offeringId } = await params;
  const offering = await getProgramOfferingById(offeringId);

  if (!offering || offering.campus_id !== id) {
    redirect(`/campuses/${id}/program-offerings`);
  }

  const basePath = `/campuses/${id}/program-offerings/${offeringId}/major-offerings`;

  return (
    <div className="flex w-2/3 flex-col">
      <MajorOfferingCreate
        basePath={basePath}
        fixedProgramOfferingId={offeringId}
      />
    </div>
  );
};

export default CreateCampusProgramMajorOfferingPage;
