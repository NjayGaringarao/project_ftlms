"use client";

import { DoorOpen } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import type { ExtendedRoom } from "@/models";

type SelectRoomDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomQuery: string;
  onRoomQueryChange: (value: string) => void;
  roomCampusFilter: string;
  onRoomCampusFilterChange: (value: string) => void;
  roomCampusOptions: Array<{ id: string; name: string }>;
  rooms: ExtendedRoom[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
};

const SelectRoomDialog = ({
  open,
  onOpenChange,
  roomQuery,
  onRoomQueryChange,
  roomCampusFilter,
  onRoomCampusFilterChange,
  roomCampusOptions,
  rooms,
  selectedRoomId,
  onSelectRoom,
}: SelectRoomDialogProps) => {
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
          onChange={(event) => onRoomQueryChange(event.target.value)}
        />

        <select
          value={roomCampusFilter}
          onChange={(event) => onRoomCampusFilterChange(event.target.value)}
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
          {rooms.map((item) => (
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
