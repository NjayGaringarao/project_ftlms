import { redirect } from "next/navigation";
import { CourseOfferingEdit } from "@/components/admin/course-offering-edit";
import { getCourseOfferingById } from "@/lib/admin/course-offerings";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

const EditPage = async ({ params }: EditPageProps) => {
  const { id } = await params;
  const offering = await getCourseOfferingById(id);

  if (!offering) {
    redirect("/course-offerings");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <CourseOfferingEdit offering={offering} />
    </div>
  );
};

export default EditPage;
