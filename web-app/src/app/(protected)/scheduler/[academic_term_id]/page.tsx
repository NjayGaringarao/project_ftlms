import ScheduleMapper from "@/features/scheduler/components/schedule-mapper";

type AcademicTermIdPageProps = {
  params: Promise<{
    academic_term_id: string;
  }>;
};

const AcademicTermIdPage = async ({ params }: AcademicTermIdPageProps) => {
  const { academic_term_id } = await params;

  return (
    <div className="flex w-full h-full overflow-hidden p-4">
      <div className="min-w-0 flex-1 overflow-hidden">
        <ScheduleMapper academic_term_id={academic_term_id} />
      </div>
    </div>
  );
};

export default AcademicTermIdPage;
