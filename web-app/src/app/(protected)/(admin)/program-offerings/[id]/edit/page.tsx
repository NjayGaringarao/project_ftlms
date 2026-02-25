import { redirect } from "next/navigation";
import { ProgramOfferingEdit } from "@/components/admin/program-offering-edit";
import { getProgramOfferingById } from "@/lib/admin/program-offerings";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

const EditPage = async ({ params }: EditPageProps) => {
  const { id } = await params;
  const offering = await getProgramOfferingById(id);

  if (!offering) {
    redirect("/program-offerings");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <ProgramOfferingEdit offering={offering} />
    </div>
  );
};

export default EditPage;
