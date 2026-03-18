import ScheduleMapper from "@/components/scheduler/schedule-mapper";
import { MapperQueryParams } from "@/components/scheduler/utils";

type MapperPageProps = {
  params: Promise<{
    academic_term_id: string;
  }>;
};

const MapperPage = async ({ params }: MapperPageProps) => {
  const { academic_term_id } = await params;
  return (
    <ScheduleMapper academic_term_id={academic_term_id} />
  )
}

export default MapperPage
