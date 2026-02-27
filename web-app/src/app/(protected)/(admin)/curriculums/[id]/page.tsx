import { redirect } from "next/navigation";
import { CurriculumView } from "@/components/admin/curriculum/curriculum-view";
import {
  getCurriculumById,
  getCurriculumTermCourseLinks,
} from "@/lib/admin/curriculums";
import { getCoursesList } from "@/lib/admin/courses";
import { getTermsList } from "@/lib/admin/terms";

export const dynamic = "force-dynamic";

type ViewCurriculumPageProps = {
  params: Promise<{ id: string }>;
};

const ViewCurriculumPage = async ({ params }: ViewCurriculumPageProps) => {
  const { id } = await params;
  const [curriculum, termCourseLinks, availableTerms, availableCourses] =
    await Promise.all([
      getCurriculumById(id),
      getCurriculumTermCourseLinks(id),
      getTermsList(),
      getCoursesList(),
    ]);

  if (!curriculum) {
    redirect("/curriculums");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <CurriculumView
        curriculum={curriculum}
        termCourseLinks={termCourseLinks}
        availableTerms={availableTerms}
        availableCourses={availableCourses}
        basePath="/curriculums"
      />
    </div>
  );
};

export default ViewCurriculumPage;
