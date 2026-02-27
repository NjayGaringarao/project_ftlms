import { redirect } from "next/navigation";
import { CurriculumEdit } from "@/components/admin/curriculum/curriculum-edit";
import { getCurriculumById } from "@/lib/admin/curriculums";

export const dynamic = "force-dynamic";

type EditCurriculumPageProps = {
  params: Promise<{ id: string }>;
};

const EditCurriculumPage = async ({ params }: EditCurriculumPageProps) => {
  const { id } = await params;
  const curriculum = await getCurriculumById(id);

  if (!curriculum) {
    redirect("/curriculums");
  }

  return (
    <div className="flex w-1/2 flex-col">
      <CurriculumEdit curriculum={curriculum} basePath="/curriculums" />
    </div>
  );
};

export default EditCurriculumPage;
