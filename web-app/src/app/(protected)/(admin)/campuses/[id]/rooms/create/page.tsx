import { RoomCreate } from "@/components/admin/campus/room-create";

type CreateCampusRoomPageProps = {
  params: Promise<{ id: string }>;
};

const CreateCampusRoomPage = async ({ params }: CreateCampusRoomPageProps) => {
  const { id } = await params;
  const basePath = `/campuses/${id}/rooms`;

  return (
    <div className="flex w-1/2 flex-col">
      <RoomCreate basePath={basePath} fixedCampusId={id} />
    </div>
  );
};

export default CreateCampusRoomPage;
