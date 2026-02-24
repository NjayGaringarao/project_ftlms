import { redirect } from "next/navigation";
import { CampusEditForm } from "@/components/admin/campus-edit-form";
import { getCampusById } from "@/lib/admin/campuses";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

const EditPage = async ({ params }: EditPageProps) => {
  const { id } = await params;
  const campus = await getCampusById(id);

  if (!campus) {
    redirect("/university/campuses");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <CampusEditForm campus={campus} />
    </div>
  );
};

export default EditPage;
