import { redirect } from "next/navigation";
import { DepartmentView } from "@/components/university/department-view";
import { getDepartmentById } from "@/lib/university/departments";

export const dynamic = "force-dynamic";

type ViewPageProps = {
  params: Promise<{ id: string }>;
};

const ViewPage = async ({ params }: ViewPageProps) => {
  const { id } = await params;
  const department = await getDepartmentById(id);

  if (!department) {
    redirect("/university/departments");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <DepartmentView department={department} />
    </div>
  );
};

export default ViewPage;
