import { redirect } from "next/navigation";
import { CurriculumView } from "@/components/admin/curriculum/curriculum-view";
import { getCurriculumById } from "@/lib/admin/curriculums";

export const dynamic = "force-dynamic";

type ViewCurriculumPageProps = {
  params: Promise<{ id: string }>;
};

const ViewCurriculumPage = async ({ params }: ViewCurriculumPageProps) => {
  const { id } = await params;
  const curriculum = await getCurriculumById(id);

  if (!curriculum) {
    redirect("/curriculums");
  }

  return (
    <div className="flex w-1/2 flex-col">
      <CurriculumView curriculum={curriculum} basePath="/curriculums" />
    </div>
  );
};

export default ViewCurriculumPage;
