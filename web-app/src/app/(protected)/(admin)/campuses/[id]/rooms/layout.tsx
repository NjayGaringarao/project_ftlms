import React from "react";
import { redirect } from "next/navigation";
import { RoomsList } from "@/features/admin/components/campus/rooms-list";
import { getRoomsByCampus } from "@/features/admin/lib/rooms";
import { getCampusById } from "@/features/admin/lib/campuses";

type CampusRoomsLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

const CampusRoomsLayout = async ({
  children,
  params,
}: CampusRoomsLayoutProps) => {
  const { id } = await params;
  const campus = await getCampusById(id);

  if (!campus) {
    redirect("/campuses");
  }

  const rooms = await getRoomsByCampus(id);
  const basePath = `/campuses/${id}/rooms`;

  return (
    <div className="flex h-full w-2/3 overflow-hidden gap-4">
      <div className="flex-1 overflow-y-auto">
        <RoomsList
          rooms={rooms}
          basePath={basePath}
          createPath={`${basePath}/create`}
        />
      </div>
      {children}
    </div>
  );
};

export default CampusRoomsLayout;
