import { redirect } from "next/navigation";
import { DepartmentEdit } from "@/components/admin/department-edit";
import { getDepartmentById } from "@/lib/admin/departments";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

const EditPage = async ({ params }: EditPageProps) => {
  const { id } = await params;
  const department = await getDepartmentById(id);

  if (!department) {
    redirect("/departments");
  }

  return (
    <div className="flex w-1/3 flex-col">
      <DepartmentEdit department={department} />
    </div>
  );
};

export default EditPage;
