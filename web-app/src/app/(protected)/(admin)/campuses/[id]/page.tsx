import { redirect } from "next/navigation";
import { CampusView } from "@/components/university/campus-view";
import { getCampusById } from "@/lib/university/campuses";

export const dynamic = "force-dynamic";

type ViewPageProps = {
  params: Promise<{ id: string }>;
};

const ViewPage = async ({ params }: ViewPageProps) => {
  const { id } = await params;
  const campus = await getCampusById(id);

  if (!campus) {
    redirect("/university/campuses");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <CampusView campus={campus} />
    </div>
  );
};

export default ViewPage;
