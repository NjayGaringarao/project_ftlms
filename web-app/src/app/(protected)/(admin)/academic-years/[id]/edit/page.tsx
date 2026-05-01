import { redirect } from "next/navigation";
import { YearEdit } from "@/features/admin/components/academic-year/year-edit";
import { getAcademicYearById } from "@/features/admin/lib/academic-years";
import { getTermsByAcademicYearId } from "@/features/admin/lib/terms";

export const dynamic = "force-dynamic";

type EditAcademicYearPageProps = {
  params: Promise<{ id: string }>;
};

const EditAcademicYearPage = async ({ params }: EditAcademicYearPageProps) => {
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
      <YearEdit year={year} terms={terms} />
    </div>
  );
};

export default EditAcademicYearPage;
