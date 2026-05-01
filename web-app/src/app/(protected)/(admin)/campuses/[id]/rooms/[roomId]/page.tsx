import { redirect } from "next/navigation";
import { RoomView } from "@/features/admin/components/campus/room-view";
import { getRoomById } from "@/features/admin/lib/rooms";

export const dynamic = "force-dynamic";

type ViewCampusRoomPageProps = {
  params: Promise<{ id: string; roomId: string }>;
};

const ViewCampusRoomPage = async ({ params }: ViewCampusRoomPageProps) => {
  const { id, roomId } = await params;
  const basePath = `/campuses/${id}/rooms`;
  const room = await getRoomById(roomId);

  if (!room || room.campus_id !== id) {
    redirect(basePath);
  }

  return (
    <div className="flex w-1/2 flex-col">
      <RoomView room={room} basePath={basePath} />
    </div>
  );
};

export default ViewCampusRoomPage;
