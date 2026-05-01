import { CourseCreate } from "@/features/admin/components/course/course-create";

const CreateCoursePage = () => {
  return (
    <div className="flex w-2/3 flex-col">
      <CourseCreate />
    </div>
  );
};

export default CreateCoursePage;
