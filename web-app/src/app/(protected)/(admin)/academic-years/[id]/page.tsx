import { redirect } from "next/navigation";
import { YearView } from "@/components/admin/academic-year/year-view";
import { getAcademicYearById } from "@/lib/admin/academic-years";
import { getTermsByAcademicYearId } from "@/lib/admin/terms";

export const dynamic = "force-dynamic";

type ViewAcademicYearPageProps = {
  params: Promise<{ id: string }>;
};

const ViewAcademicYearPage = async ({ params }: ViewAcademicYearPageProps) => {
  const { id } = await params;

  const [year, terms] = await Promise.all([
    getAcademicYearById(id),
    getTermsByAcademicYearId(id),
  ]);

  if (!year) {
    redirect("/academic-years");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <YearView year={year} terms={terms} />
    </div>
  );
};

export default ViewAcademicYearPage;
