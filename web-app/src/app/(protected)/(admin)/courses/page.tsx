import { CoursesManagement } from "@/features/admin/components/course/courses-management";
import { getCoursesList, getCourseById } from "@/features/admin/lib/courses";
import { getAdminPanelQueryState } from "@/features/admin/lib/management-query";

type CoursesPageProps = {
  searchParams: Promise<{
    id?: string | string[];
    new?: string | string[];
  }>;
};

const CoursesPage = async ({ searchParams }: CoursesPageProps) => {
  const queryState = getAdminPanelQueryState(await searchParams);
  const [courses, selectedCourse] = await Promise.all([
    getCoursesList(),
    queryState.selectedId ? getCourseById(queryState.selectedId) : null,
  ]);

  return (
    <CoursesManagement
      courses={courses}
      selectedCourse={selectedCourse}
      selectedId={queryState.selectedId}
      isCreating={queryState.isCreating}
    />
  );
};

export default CoursesPage;
