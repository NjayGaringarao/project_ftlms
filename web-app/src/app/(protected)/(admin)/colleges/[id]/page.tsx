import { redirect } from "next/navigation";
import { CollegeView } from "@/features/admin/components/college/college-view";
import { getCollegeById } from "@/features/admin/lib/colleges";

export const dynamic = "force-dynamic";

type ViewPageProps = {
  params: Promise<{ id: string }>;
};

const ViewPage = async ({ params }: ViewPageProps) => {
  const { id } = await params;
  const college = await getCollegeById(id);

  if (!college) {
    redirect("/colleges");
  }

  return (
    <div className="flex w-1/3 flex-col">
      <CollegeView college={college} />
    </div>
  );
};

export default ViewPage;
