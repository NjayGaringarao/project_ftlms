import { redirect } from "next/navigation";
import { MajorView } from "@/components/admin/major-view";
import { getMajorById } from "@/lib/admin/majors";
import { getProgramById } from "@/lib/admin/programs";

export const dynamic = "force-dynamic";

type ViewProgramMajorPageProps = {
  params: Promise<{ id: string; programId: string; majorId: string }>;
};

const ViewProgramMajorPage = async ({ params }: ViewProgramMajorPageProps) => {
  const { id, programId, majorId } = await params;
  const basePath = `/departments/${id}/programs/${programId}/majors`;
  const [program, major] = await Promise.all([
    getProgramById(programId),
    getMajorById(majorId),
  ]);

  if (
    !program ||
    program.department_id !== id ||
    !major ||
    major.program_id !== programId
  ) {
    redirect(basePath);
  }

  return (
    <div className="flex w-2/3 flex-col">
      <MajorView major={major} basePath={basePath} />
    </div>
  );
};

export default ViewProgramMajorPage;
