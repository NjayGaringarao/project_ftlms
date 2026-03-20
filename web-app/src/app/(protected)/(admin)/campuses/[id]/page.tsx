import { redirect } from "next/navigation";
import { CampusView } from "@/components/admin/campus/campus-view";
import { getCampusById } from "@/lib/admin/campuses";
import { getDefaultAcademicTerm } from "@/lib/admin/terms";

export const dynamic = "force-dynamic";

type ViewPageProps = {
  params: Promise<{ id: string }>;
};

const ViewPage = async ({ params }: ViewPageProps) => {
  const { id } = await params;
  const [campus, defaultTerm] = await Promise.all([
    getCampusById(id),
    getDefaultAcademicTerm(),
  ]);

  if (!campus) {
    redirect("/campuses");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <CampusView campus={campus} defaultAcademicTermId={defaultTerm?.id} />
    </div>
  );
};

export default ViewPage;
