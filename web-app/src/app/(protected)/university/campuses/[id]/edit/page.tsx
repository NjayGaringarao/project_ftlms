import { redirect } from "next/navigation";
import { CampusEditForm } from "@/components/university/campus-edit-form";
import { getCampusById, getDirectorOptions } from "@/lib/university/campuses";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

const EditPage = async ({ params }: EditPageProps) => {
  const { id } = await params;
  const [campus, directors] = await Promise.all([
    getCampusById(id),
    getDirectorOptions(),
  ]);

  if (!campus) {
    redirect("/university/campuses");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <CampusEditForm campus={campus} directors={directors} />
    </div>
  );
};

export default EditPage;
