import { redirect } from "next/navigation";
import { CourseView } from "@/components/admin/course-view";
import { getCourseById } from "@/lib/admin/courses";

export const dynamic = "force-dynamic";

type ViewCoursePageProps = {
  params: Promise<{ id: string }>;
};

const ViewCoursePage = async ({ params }: ViewCoursePageProps) => {
  const { id } = await params;
  const course = await getCourseById(id);

  if (!course) {
    redirect("/courses");
  }

  return (
    <div className="flex w-1/3 flex-col">
      <CourseView course={course} />
    </div>
  );
};

export default ViewCoursePage;
