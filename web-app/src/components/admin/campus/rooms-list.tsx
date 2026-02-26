"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DoorOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExtendedRoom } from "@/models";
import { useListState } from "@/hooks/useListState";
import ListItem from "../list-item";
import AdminListContainer from "../admin-list-container";

type RoomsListProps = {
  rooms: ExtendedRoom[];
  basePath?: string;
  createPath?: string;
};

export const RoomsList = ({
  rooms,
  basePath = "/rooms",
  createPath = "/rooms/create",
}: RoomsListProps) => {
  const router = useRouter();
  const idMatchPattern = useMemo(
    () =>
      new RegExp(
        `^${basePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/([^/]+)(?:/|$)`,
      ),
    [basePath],
  );
  const { query, setQuery, selectedId, filteredItems } = useListState({
    items: rooms,
    match: idMatchPattern,
    filter: (items, rawQuery) => {
      const q = rawQuery.trim().toLowerCase();
      if (!q) return items;

      return items.filter((room) => {
        const code = room.code.toLowerCase();
        const name = room.name?.toLowerCase() ?? "";
        const campusName = room.campus?.name?.toLowerCase() ?? "";
        const capacity = String(room.capacity ?? "");

        return (
          code.includes(q) ||
          name.includes(q) ||
          campusName.includes(q) ||
          capacity.includes(q)
        );
      });
    },
  });

  return (
    <AdminListContainer
      header={
        <>
          <Input
            placeholder="Search rooms by code, name, or campus"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href={createPath}>Create Room</Link>
          </Button>
        </>
      }
      isItemSelected={!!selectedId}
      directoryLevel="SECOND"
    >
      {filteredItems.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-foreground/70">
          No rooms match your search.
        </div>
      )}

      {filteredItems.map((room) => (
        <ListItem
          key={room.id}
          onClick={() => router.push(`${basePath}/${room.id}`)}
          title={room.code}
          subtitle={[room.name || "No name"]}
          isSelected={selectedId === room.id}
          icon={<DoorOpen className="h-14 w-14 text-background" />}
          annotations={
            <span className="inline-flex rounded-full bg-foreground/10 px-3 py-1 text-xs text-foreground">
              Capacity: {room.capacity ?? "N/A"}
            </span>
          }
        />
      ))}
    </AdminListContainer>
  );
};
