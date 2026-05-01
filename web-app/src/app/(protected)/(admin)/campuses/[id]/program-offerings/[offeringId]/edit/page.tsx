import { redirect } from "next/navigation";
import { ProgramOfferingEdit } from "@/features/admin/components/campus/program-offering-edit";
import { getProgramOfferingById } from "@/features/admin/lib/program-offerings";

export const dynamic = "force-dynamic";

type EditCampusProgramOfferingPageProps = {
  params: Promise<{ id: string; offeringId: string }>;
};

const EditCampusProgramOfferingPage = async ({
  params,
}: EditCampusProgramOfferingPageProps) => {
  const { id, offeringId } = await params;
  const basePath = `/campuses/${id}/program-offerings`;
  const offering = await getProgramOfferingById(offeringId);

  if (!offering || offering.campus_id !== id) {
    redirect(basePath);
  }

  return (
    <div className="flex w-1/2 flex-col">
      <ProgramOfferingEdit
        offering={offering}
        basePath={basePath}
        fixedCampusId={id}
      />
    </div>
  );
};

export default EditCampusProgramOfferingPage;
