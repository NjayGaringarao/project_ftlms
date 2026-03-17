"use client";

import { useMemo, useState } from "react";
import { DoorOpen } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import type { ExtendedRoom } from "@/models";

type SelectRoomDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rooms: ExtendedRoom[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
};

const SelectRoomDialog = ({
  open,
  onOpenChange,
  rooms,
  selectedRoomId,
  onSelectRoom,
}: SelectRoomDialogProps) => {
  const [roomQuery, setRoomQuery] = useState("");
  const [roomCampusFilter, setRoomCampusFilter] = useState("");

  const roomCampusOptions = useMemo(() => {
    const map = new Map<string, string>();
    rooms.forEach((item) => {
      if (item.campus?.id && item.campus?.name) {
        map.set(item.campus.id, item.campus.name);
      }
    });

    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    const normalized = roomQuery.trim().toLowerCase();

    return rooms.filter((item) => {
      if (roomCampusFilter && item.campus_id !== roomCampusFilter) {
        return false;
      }

      if (!normalized) return true;

      return (
        item.code.toLowerCase().includes(normalized) ||
        item.name?.toLowerCase().includes(normalized)
      );
    });
  }, [rooms, roomQuery, roomCampusFilter]);

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Select Room"
      description="Select one context at a time. Choosing a room clears faculty and block context."
      contentClassName="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden"
    >
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <Input
          placeholder="Search rooms"
          value={roomQuery}
          onChange={(event) => setRoomQuery(event.target.value)}
        />

        <select
          value={roomCampusFilter}
          onChange={(event) => setRoomCampusFilter(event.target.value)}
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          <option value="">All Campuses</option>
          {roomCampusOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {filteredRooms.map((item) => (
            <ListItemSmall
              key={item.id}
              title={item.code}
              subtitle={[`${item.name} | ${item.campus?.name ?? "Unknown Campus"}`]}
              isSelected={item.id === selectedRoomId}
              onClick={() => onSelectRoom(item.id)}
              icon={<DoorOpen className="h-5 w-5 text-background/80" />}
              annotations={
                <span className="rounded-md bg-foreground/10 px-1.5 py-1 text-xs">
                  Cap: {item.capacity ?? 0}
                </span>
              }
            />
          ))}
        </div>
      </div>
    </AppDialog>
  );
};

export default SelectRoomDialog;
