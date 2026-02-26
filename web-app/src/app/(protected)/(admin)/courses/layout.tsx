import React from "react";
import { CoursesList } from "@/components/admin/course/courses-list";
import { getCoursesList } from "@/lib/admin/courses";

const CoursesLayout = async ({ children }: { children: React.ReactNode }) => {
  const courses = await getCoursesList();

  return (
    <div className="flex h-full overflow-hidden gap-4">
      <div className="flex-1 overflow-y-auto">
        <CoursesList courses={courses} />
      </div>
      {children}
    </div>
  );
};

export default CoursesLayout;
