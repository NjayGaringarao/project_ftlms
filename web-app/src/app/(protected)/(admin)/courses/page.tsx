import { Suspense } from "react";
import { CoursesManagement } from "@/features/admin/components/course/courses-management";
import { ListDetailSkeleton } from "@/features/shared/components/skeletons/list-detail-skeleton";
import { getCoursesList, getCourseById } from "@/features/admin/lib/courses";
import { getAdminPanelQueryState } from "@/features/admin/lib/management-query";

type CoursesPageProps = {
  searchParams: Promise<{
    id?: string | string[];
    new?: string | string[];
  }>;
};

const CoursesContent = async ({ searchParams }: CoursesPageProps) => {
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

const CoursesPage = ({ searchParams }: CoursesPageProps) => (
  <Suspense fallback={<ListDetailSkeleton />}>
    <CoursesContent searchParams={searchParams} />
  </Suspense>
);

export default CoursesPage;
