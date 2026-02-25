import { redirect } from "next/navigation";
import { MajorOfferingEdit } from "@/components/admin/major-offering-edit";
import { getMajorOfferingById } from "@/lib/admin/major-offerings";

export const dynamic = "force-dynamic";

type EditCampusProgramMajorOfferingPageProps = {
  params: Promise<{ id: string; offeringId: string; majorOfferingId: string }>;
};

const EditCampusProgramMajorOfferingPage = async ({
  params,
}: EditCampusProgramMajorOfferingPageProps) => {
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
      <MajorOfferingEdit
        offering={offering}
        basePath={basePath}
        fixedProgramOfferingId={offeringId}
      />
    </div>
  );
};

export default EditCampusProgramMajorOfferingPage;
