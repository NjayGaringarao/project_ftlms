import { redirect } from "next/navigation";
import { CampusView } from "@/components/admin/campus-view";
import { getCampusById } from "@/lib/admin/campuses";

export const dynamic = "force-dynamic";

type ViewPageProps = {
  params: Promise<{ id: string }>;
};

const ViewPage = async ({ params }: ViewPageProps) => {
  const { id } = await params;
  const campus = await getCampusById(id);

  if (!campus) {
    redirect("/campuses");
  }

  return (
    <div className="flex w-1/3 flex-col">
      <CampusView campus={campus} />
    </div>
  );
};

export default ViewPage;
