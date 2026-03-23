"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, DoorOpen, X } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import type { Campus, ExtendedRoom } from "@/models";
import CampusPickerDialog from "./campus-picker-dialog";
import { Button } from "@/components/ui/button";

type RoomPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ExtendedRoom[];
  selectedId?: string | null;
  onSelect: (id: string | null) => void;
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  allowOnline?: boolean;
  onlineLabel?: string;
  renderSubtitle?: (item: ExtendedRoom) => string[];
  renderAnnotation?: (item: ExtendedRoom) => ReactNode;
  defaultCampusId?: string | null;
};

const RoomPickerDialog = ({
  open,
  onOpenChange,
  items,
  selectedId,
  onSelect,
  title = "Select Room",
  description = "Select room to map. You can select faculty and block independently.",
  searchPlaceholder = "Search rooms",
  allowOnline = false,
  onlineLabel = "Online / No Room",
  renderSubtitle,
  renderAnnotation,
  defaultCampusId,
}: RoomPickerDialogProps) => {
  const [roomQuery, setRoomQuery] = useState("");
  const [roomCampusFilter, setRoomCampusFilter] = useState("");
  const [campusDialogOpen, setCampusDialogOpen] = useState(false);
  const [campusQuery, setCampusQuery] = useState("");
  const roomCampusOptions = useMemo(() => {
    const map = new Map<string, Campus>();
    items.forEach((item) => {
      if (item.campus?.id && item.campus?.name) {
        map.set(item.campus.id, {
          id: item.campus.id,
          code: item.campus.code ?? "",
          name: item.campus.name ?? "Unknown Campus",
          address: item.campus.address
        });
      }
    });

    return Array.from(map.values());
  }, [items]);

  const filteredRooms = useMemo(() => {
    const normalized = roomQuery.trim().toLowerCase();

    return items.filter((item) => {
      if (roomCampusFilter && item.campus_id !== roomCampusFilter) {
        return false;
      }

      if (!normalized) return true;

      return (
        item.code.toLowerCase().includes(normalized) ||
        item.name?.toLowerCase().includes(normalized)
      );
    });
  }, [items, roomQuery, roomCampusFilter]);

  useEffect(() => {
    if (!open) return;
    setRoomQuery("");
    setRoomCampusFilter(defaultCampusId ?? "");
  }, [open]);

  useEffect(() => {
    if (!campusDialogOpen) return;
    setCampusQuery("");
  }, [campusDialogOpen]);

  const selectedCampus =
    roomCampusOptions.find((campus) => campus.id === roomCampusFilter) ?? null;

  const renderFilterButton = (
    label: string,
    selectedLabel: string | null,
    onClick: () => void,
    onClear?: () => void,
  ) => (
    <div className="flex items-center flex-1">
      <Button
        variant="outline"
        size="xs"
        className={selectedLabel ? "font-semibold flex-1" : "flex-1"}
        onClick={onClick}
      >
        <span className="truncate">{selectedLabel ?? label}</span>
        <ChevronDown className="h-3 w-3 text-foreground/60" />
      </Button>
      {selectedLabel && onClear ? (
        <Button
          variant="ghost"
          size="xs"
          className="w-8"
          onClick={onClear}
          title={`Clear ${label}`}
        >
          <X className="h-3 w-3 text-foreground/60" />
        </Button>
      ) : null}
    </div>
  );

  return (
    <>
    
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      contentClassName="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden"
    >
      <div className="flex h-full flex-col gap-1 overflow-hidden">
        <Input
          placeholder={searchPlaceholder}
          value={roomQuery}
          onChange={(event) => setRoomQuery(event.target.value)}
        />

        {renderFilterButton(
          "All Campus",
          selectedCampus ? selectedCampus.name : null,
          () => setCampusDialogOpen(true),
          roomCampusFilter ? () => setRoomCampusFilter("") : undefined,
        )}

        <div className="flex-1 grid grid-cols-2 gap-2 overflow-y-auto">
          {allowOnline ? (
            <ListItemSmall
              key="online"
              title={onlineLabel}
              subtitle={["No room assignment"]}
              isSelected={selectedId === null}
              onClick={() => onSelect(null)}
            />
          ) : null}
          {filteredRooms.map((item) => (
            <ListItemSmall
              key={item.id}
              title={item.code}
              subtitle={
                renderSubtitle
                  ? renderSubtitle(item)
                  : [
                      `${item.name} | ${item.campus?.name ?? "Unknown Campus"}`,
                    ]
              }
              isSelected={item.id === selectedId}
              onClick={() => onSelect(item.id)}
              icon={<DoorOpen className="h-5 w-5 text-background/80" />}
              annotations={
                renderAnnotation ? (
                  renderAnnotation(item)
                ) : (
                  <span className="rounded-md bg-foreground/10 px-1.5 py-1 text-xs">
                    Cap: {item.capacity ?? 0}
                  </span>
                )
              }
            />
          ))}
        </div>
      </div>
    </AppDialog>

    <CampusPickerDialog
      open={campusDialogOpen}
      onOpenChange={setCampusDialogOpen}
      campuses={roomCampusOptions.map((campus) => ({
        id: campus.id,
        code: campus.code,
        name: campus.name,
        address: campus.address,
      }))}
      selectedCampusId={roomCampusFilter}
      query={campusQuery}
      onQueryChange={setCampusQuery}
      onSelect={(nextCampusId) => {
        setRoomCampusFilter(nextCampusId);
        setCampusDialogOpen(false);
      }}
      emptyState="No campuses found."
    />
      </>
  );
};

export default RoomPickerDialog;
