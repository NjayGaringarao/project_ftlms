import { redirect } from "next/navigation";
import { MajorOfferingEdit } from "@/components/admin/major-offering-edit";
import { getMajorOfferingById } from "@/lib/admin/major-offerings";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

const EditPage = async ({ params }: EditPageProps) => {
  const { id } = await params;
  const offering = await getMajorOfferingById(id);

  if (!offering) {
    redirect("/major-offerings");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <MajorOfferingEdit offering={offering} />
    </div>
  );
};

export default EditPage;
