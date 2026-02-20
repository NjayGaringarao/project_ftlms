import { redirect } from "next/navigation";
import { SemesterEditForm } from "@/components/university/semester-edit-form";
import { getSemesterById } from "@/lib/university/semesters";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

const EditPage = async ({ params }: EditPageProps) => {
  const { id } = await params;
  const semester = await getSemesterById(id);

  if (!semester) {
    redirect("/university/semesters");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <SemesterEditForm semester={semester} />
    </div>
  );
};

export default EditPage;
