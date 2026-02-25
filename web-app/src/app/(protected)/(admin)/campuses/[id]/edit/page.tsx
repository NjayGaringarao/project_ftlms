import { redirect } from "next/navigation";
import { CampusEdit } from "@/components/admin/campus-edit";
import { getCampusById } from "@/lib/admin/campuses";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

const EditPage = async ({ params }: EditPageProps) => {
  const { id } = await params;
  const campus = await getCampusById(id);

  if (!campus) {
    redirect("/campuses");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <CampusEdit campus={campus} />
    </div>
  );
};

export default EditPage;
