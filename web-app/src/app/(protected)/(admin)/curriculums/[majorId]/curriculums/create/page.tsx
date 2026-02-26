import { CurriculumCreate } from "@/components/admin/curriculum/curriculum-create";

type CreateCurriculumPageProps = {
  params: Promise<{ majorId: string }>;
};

const CreateCurriculumPage = async ({ params }: CreateCurriculumPageProps) => {
  const { majorId } = await params;
  const basePath = `/curriculums/${majorId}/curriculums`;

  return (
    <div className="flex w-2/3 flex-col">
      <CurriculumCreate majorId={majorId} basePath={basePath} />
    </div>
  );
};

export default CreateCurriculumPage;
