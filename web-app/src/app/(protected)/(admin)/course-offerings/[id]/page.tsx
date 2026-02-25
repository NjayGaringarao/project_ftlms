import { redirect } from "next/navigation";
import { CourseOfferingView } from "@/components/admin/course-offering-view";
import { getCourseOfferingById } from "@/lib/admin/course-offerings";

export const dynamic = "force-dynamic";

type ViewPageProps = {
  params: Promise<{ id: string }>;
};

const ViewPage = async ({ params }: ViewPageProps) => {
  const { id } = await params;
  const offering = await getCourseOfferingById(id);

  if (!offering) {
    redirect("/course-offerings");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <CourseOfferingView offering={offering} />
    </div>
  );
};

export default ViewPage;
