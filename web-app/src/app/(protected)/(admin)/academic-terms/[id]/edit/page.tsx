import { redirect } from "next/navigation";
import { TermEdit } from "@/components/admin/academic-term/term-edit";
import { getTermById } from "@/lib/admin/terms";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

const EditPage = async ({ params }: EditPageProps) => {
  const { id } = await params;
  const term = await getTermById(id);

  if (!term) {
    redirect("/academic-terms");
  }

  return (
    <div className="flex w-1/3 flex-col">
      <TermEdit term={term} />
    </div>
  );
};

export default EditPage;
