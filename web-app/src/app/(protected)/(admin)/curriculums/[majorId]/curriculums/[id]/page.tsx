import { redirect } from "next/navigation";
import { CurriculumView } from "@/components/admin/curriculum/curriculum-view";
import { getCurriculumById } from "@/lib/admin/curriculums";

export const dynamic = "force-dynamic";

type ViewCurriculumPageProps = {
  params: Promise<{ majorId: string; id: string }>;
};

const ViewCurriculumPage = async ({ params }: ViewCurriculumPageProps) => {
  const { majorId, id } = await params;
  const basePath = `/curriculums/${majorId}/curriculums`;
  const curriculum = await getCurriculumById(id);

  if (!curriculum || curriculum.major_id !== majorId) {
    redirect(basePath);
  }

  return (
    <div className="flex w-1/2 flex-col">
      <CurriculumView curriculum={curriculum} basePath={basePath} />
    </div>
  );
};

export default ViewCurriculumPage;
