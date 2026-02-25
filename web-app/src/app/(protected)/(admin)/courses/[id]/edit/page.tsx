import { redirect } from "next/navigation";
import { CourseEdit } from "@/components/admin/course-edit";
import { getCourseById } from "@/lib/admin/courses";

export const dynamic = "force-dynamic";

type EditCoursePageProps = {
  params: Promise<{ id: string }>;
};

const EditCoursePage = async ({ params }: EditCoursePageProps) => {
  const { id } = await params;
  const course = await getCourseById(id);

  if (!course) {
    redirect("/courses");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <CourseEdit course={course} />
    </div>
  );
};

export default EditCoursePage;
