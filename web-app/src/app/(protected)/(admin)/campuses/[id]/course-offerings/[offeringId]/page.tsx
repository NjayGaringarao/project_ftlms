import { redirect } from "next/navigation";
import { CourseOfferingView } from "@/components/admin/campus/course-offering-view";
import { getCourseOfferingById } from "@/lib/admin/course-offerings";

export const dynamic = "force-dynamic";

type ViewCampusCourseOfferingPageProps = {
  params: Promise<{ id: string; offeringId: string }>;
};

const ViewCampusCourseOfferingPage = async ({
  params,
}: ViewCampusCourseOfferingPageProps) => {
  const { id, offeringId } = await params;
  const basePath = `/campuses/${id}/course-offerings`;
  const offering = await getCourseOfferingById(offeringId);

  if (!offering || offering.campus_id !== id) {
    redirect(basePath);
  }

  return (
    <div className="flex w-1/2 flex-col">
      <CourseOfferingView offering={offering} basePath={basePath} />
    </div>
  );
};

export default ViewCampusCourseOfferingPage;
