import { redirect } from "next/navigation";
import { DepartmentView } from "@/components/admin/department/department-view";
import { getDepartmentById } from "@/lib/admin/departments";

export const dynamic = "force-dynamic";

type ViewPageProps = {
  params: Promise<{ id: string }>;
};

const ViewPage = async ({ params }: ViewPageProps) => {
  const { id } = await params;
  const department = await getDepartmentById(id);

  if (!department) {
    redirect("/departments");
  }

  return (
    <div className="flex w-1/3 flex-col">
      <DepartmentView department={department} />
    </div>
  );
};

export default ViewPage;
