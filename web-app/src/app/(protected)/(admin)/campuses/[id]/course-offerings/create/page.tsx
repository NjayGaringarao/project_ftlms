import { CourseOfferingCreate } from "@/components/admin/course-offering-create";

type CreateCampusCourseOfferingPageProps = {
  params: Promise<{ id: string }>;
};

const CreateCampusCourseOfferingPage = async ({
  params,
}: CreateCampusCourseOfferingPageProps) => {
  const { id } = await params;
  const basePath = `/campuses/${id}/course-offerings`;

  return (
    <div className="flex w-2/3 flex-col">
      <CourseOfferingCreate basePath={basePath} fixedCampusId={id} />
    </div>
  );
};

export default CreateCampusCourseOfferingPage;
