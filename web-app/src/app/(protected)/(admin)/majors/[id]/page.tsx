import { redirect } from "next/navigation";
import { MajorView } from "@/components/admin/major-view";
import { getMajorById } from "@/lib/admin/majors";

export const dynamic = "force-dynamic";

type ViewPageProps = {
  params: Promise<{ id: string }>;
};

const ViewPage = async ({ params }: ViewPageProps) => {
  const { id } = await params;
  const major = await getMajorById(id);

  if (!major) {
    redirect("/majors");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <MajorView major={major} />
    </div>
  );
};

export default ViewPage;
