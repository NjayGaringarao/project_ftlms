import { redirect } from "next/navigation";
import { CurriculumEdit } from "@/components/admin/curriculum/curriculum-edit";
import { getCurriculumById } from "@/lib/admin/curriculums";

export const dynamic = "force-dynamic";

type EditCurriculumPageProps = {
  params: Promise<{ majorId: string; id: string }>;
};

const EditCurriculumPage = async ({ params }: EditCurriculumPageProps) => {
  const { majorId, id } = await params;
  const basePath = `/curriculums/${majorId}/curriculums`;
  const curriculum = await getCurriculumById(id);

  if (!curriculum || curriculum.major_id !== majorId) {
    redirect(basePath);
  }

  return (
    <div className="flex w-2/3 flex-col">
      <CurriculumEdit curriculum={curriculum} basePath={basePath} />
    </div>
  );
};

export default EditCurriculumPage;
