import { redirect } from "next/navigation";
import { MajorEdit } from "@/components/admin/major-edit";
import { getMajorById } from "@/lib/admin/majors";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

const EditPage = async ({ params }: EditPageProps) => {
  const { id } = await params;
  const major = await getMajorById(id);

  if (!major) {
    redirect("/majors");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <MajorEdit major={major} />
    </div>
  );
};

export default EditPage;
