import { redirect } from "next/navigation";
import { RoomEdit } from "@/features/admin/components/campus/room-edit";
import { getRoomById } from "@/features/admin/lib/rooms";

export const dynamic = "force-dynamic";

type EditCampusRoomPageProps = {
  params: Promise<{ id: string; roomId: string }>;
};

const EditCampusRoomPage = async ({ params }: EditCampusRoomPageProps) => {
  const { id, roomId } = await params;
  const basePath = `/campuses/${id}/rooms`;
  const room = await getRoomById(roomId);

  if (!room || room.campus_id !== id) {
    redirect(basePath);
  }

  return (
    <div className="flex w-2/3 flex-col">
      <RoomEdit room={room} basePath={basePath} />
    </div>
  );
};

export default EditCampusRoomPage;
