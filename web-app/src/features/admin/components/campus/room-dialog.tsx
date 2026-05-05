"use client";

import { useState } from "react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ExtendedRoom } from "@/features/shared/types/models/room";
import { createRoom, updateRoom } from "@/features/admin/lib/actions";
import FormStatusBanner from "../form-status-banner";

type RoomDialogProps = {
  open: boolean;
  room: ExtendedRoom | null;
  campusId: string;
  onClose: () => void;
  onRefresh: () => void;
};

export function RoomDialog({
  open,
  room,
  campusId,
  onClose,
  onRefresh,
}: RoomDialogProps) {
  const [code, setCode] = useState(room?.code ?? "");
  const [name, setName] = useState(room?.name ?? "");
  const [capacity, setCapacity] = useState(String(room?.capacity ?? ""));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const isCreating = !room;

  const save = async () => {
    const parsedCapacity = capacity.trim() ? Number(capacity) : null;
    setIsSaving(true);
    setError("");
    const result = isCreating
      ? await createRoom({
          campus_id: campusId,
          code,
          name,
          capacity: parsedCapacity,
        })
      : await updateRoom({
          id: room.id,
          campus_id: campusId,
          code,
          name,
          capacity: parsedCapacity,
        });
    setIsSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onRefresh();
    onClose();
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title={isCreating ? "Add Room" : "Edit Room"}
    >
      <div className="space-y-4 p-4">
        <FormStatusBanner variant="compact" error={error} />
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label className="text-xs" htmlFor="room-code">
              Room Code *
            </Label>
            <Input
              id="room-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="room-name">
              Room Name
            </Label>
            <Input
              id="room-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="room-capacity">
              Capacity
            </Label>
            <Input
              id="room-capacity"
              type="number"
              min="0"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </AppDialog>
  );
}
