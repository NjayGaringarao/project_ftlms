import { redirect } from "next/navigation";
import { TermEditForm } from "@/components/university/term-edit-form";
import { getTermById } from "@/lib/university/terms";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

const EditPage = async ({ params }: EditPageProps) => {
  const { id } = await params;
  const term = await getTermById(id);

  if (!term) {
    redirect("/university/terms");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <TermEditForm term={term} />
    </div>
  );
};

export default EditPage;
