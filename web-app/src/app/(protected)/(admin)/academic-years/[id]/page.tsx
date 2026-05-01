import { redirect } from "next/navigation";
import { YearView } from "@/features/admin/components/academic-year/year-view";
import { getAcademicYearById } from "@/features/admin/lib/academic-years";
import { getTermsByAcademicYearId } from "@/features/admin/lib/terms";

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
