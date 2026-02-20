import { redirect } from "next/navigation";
import { SemesterView } from "@/components/university/semester-view";
import { getSemesterById } from "@/lib/university/semesters";

export const dynamic = "force-dynamic";

type ViewPageProps = {
  params: Promise<{ id: string }>;
};

const ViewPage = async ({ params }: ViewPageProps) => {
  const { id } = await params;
  const semester = await getSemesterById(id);

  if (!semester) {
    redirect("/university/semesters");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <SemesterView semester={semester} />
    </div>
  );
};

export default ViewPage;
