import { redirect } from "next/navigation";
import { DepartmentEditForm } from "@/components/admin/department-edit-form";
import { getDepartmentById } from "@/lib/admin/departments";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

const EditPage = async ({ params }: EditPageProps) => {
  const { id } = await params;
  const department = await getDepartmentById(id);

  if (!department) {
    redirect("/university/departments");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <DepartmentEditForm department={department} />
    </div>
  );
};

export default EditPage;
