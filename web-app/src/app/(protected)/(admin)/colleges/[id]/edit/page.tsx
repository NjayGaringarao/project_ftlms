import { redirect } from "next/navigation";
import { CollegeEdit } from "@/features/admin/components/college/college-edit";
import { getCollegeById } from "@/features/admin/lib/colleges";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

const EditPage = async ({ params }: EditPageProps) => {
  const { id } = await params;
  const college = await getCollegeById(id);

  if (!college) {
    redirect("/colleges");
  }

  return (
    <div className="flex w-1/3 flex-col">
      <CollegeEdit college={college} />
    </div>
  );
};

export default EditPage;
