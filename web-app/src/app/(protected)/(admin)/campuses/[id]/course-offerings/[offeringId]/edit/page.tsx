import { redirect } from "next/navigation";
import { CourseOfferingEdit } from "@/components/admin/course-offering-edit";
import { getCourseOfferingById } from "@/lib/admin/course-offerings";

export const dynamic = "force-dynamic";

type EditCampusCourseOfferingPageProps = {
  params: Promise<{ id: string; offeringId: string }>;
};

const EditCampusCourseOfferingPage = async ({
  params,
}: EditCampusCourseOfferingPageProps) => {
  const { id, offeringId } = await params;
  const basePath = `/campuses/${id}/course-offerings`;
  const offering = await getCourseOfferingById(offeringId);

  if (!offering || offering.campus_id !== id) {
    redirect(basePath);
  }

  return (
    <div className="flex w-2/3 flex-col">
      <CourseOfferingEdit
        offering={offering}
        basePath={basePath}
        fixedCampusId={id}
      />
    </div>
  );
};

export default EditCampusCourseOfferingPage;
