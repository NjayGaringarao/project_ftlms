"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DoorOpen, Info } from "lucide-react";
import AdminPanel from "../admin-panel";
import DangerZone from "../danger-zone";
import DeleteConfirmModal from "../delete-confirm-modal";
import { ExtendedRoom } from "@/features/shared/types/models";
import { deleteRoom } from "@/features/admin/lib/actions";

type RoomViewProps = {
  room: ExtendedRoom;
  basePath?: string;
};

export const RoomView = ({ room, basePath = "/rooms" }: RoomViewProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");

    const { error } = await deleteRoom(room.id);

    if (error) {
      setDeleteError(error);
      setIsDeleting(false);
      return;
    }

    setShowDeleteConfirm(false);
    router.push(basePath);
  };

  return (
    <AdminPanel
      title="Room Information"
      icon={Info}
      onClose={() => router.push(basePath)}
      onEdit={() => router.push(`${basePath}/${room.id}/edit`)}
    >
      <>
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <DoorOpen className="w-5 h-5" />
            <h3 className="text-base font-semibold">Room Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-foreground/60">Code</p>
              <p className="font-medium">{room.code}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Name</p>
              <p className="font-medium">{room.name || "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Capacity</p>
              <p className="font-medium">{room.capacity ?? "Not set"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-foreground/60">Campus</p>
              <p className="font-medium">{room.campus?.name ?? "Unknown"}</p>
            </div>
          </div>
        </div>

        <DangerZone
          description="Room deletion is blocked when sessions or designations are still attached."
          buttonLabel="Delete Room"
          onDeleteClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        />

        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete Room"
          description={
            <p>
              Are you sure you want to delete <strong>{room.code}</strong>?
            </p>
          }
          warning="If dependent sessions or designations exist, this operation will be rejected."
          confirmLabel="Delete Room"
          isDeleting={isDeleting}
          error={deleteError}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      </>
    </AdminPanel>
  );
};
