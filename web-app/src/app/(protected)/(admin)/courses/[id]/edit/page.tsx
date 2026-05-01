import { redirect } from "next/navigation";
import { CourseEdit } from "@/features/admin/components/course/course-edit";
import { getCourseById } from "@/features/admin/lib/courses";

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
    <div className="flex w-1/3 flex-col">
      <CourseEdit course={course} />
    </div>
  );
};

export default EditCoursePage;
