"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  CourseLoadingBlockListItem,
  FacultyListItem,
} from "@/lib/course-loading/types";
import type { ExtendedRoom } from "@/models";
import {
  getSchedulerMapperClassList,
  type SchedulerMapperClassListItem,
} from "@/lib/schedule/mapper";
import SelectBlockDialog from "./select-block-dialog";
import SelectFacultyDialog from "./select-faculty-dialog";
import SelectRoomDialog from "./select-room-dialog";
import ClassList from "./class-list";
import { ActiveContext, ContextKey, getActiveContextFromSearchParams } from "./utils";

type MapperLeftPaneProps = {
  academicTermId: string;
};


const MapperLeftPane = ({ academicTermId }: MapperLeftPaneProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeContext, setActiveContext] = useState<ActiveContext>(() =>
    getActiveContextFromSearchParams(searchParams),
  );
  const [classes, setClasses] = useState<SchedulerMapperClassListItem[]>([]);
  const [faculty, setFaculty] = useState<FacultyListItem[]>([]);
  const [rooms, setRooms] = useState<ExtendedRoom[]>([]);
  const [blocks, setBlocks] = useState<CourseLoadingBlockListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showFacultyDialog, setShowFacultyDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showRoomDialog, setShowRoomDialog] = useState(false);

  //#region Precomputed values
  const selectedFacultyId =
    activeContext?.key === "facultyId" ? activeContext.value : null;
  const selectedBlockId =
    activeContext?.key === "blockId" ? activeContext.value : null;
  const selectedRoomId =
    activeContext?.key === "roomId" ? activeContext.value : null;

  const selectedFaculty =
    faculty.find((item) => item.id === selectedFacultyId) ?? null;
  const selectedBlock = blocks.find((item) => item.id === selectedBlockId) ?? null;
  const selectedRoom = rooms.find((item) => item.id === selectedRoomId) ?? null;

  //#region Handlers

  const setQueryParams = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const setContextParam = (key: ContextKey, value: string) => {
    setActiveContext({ key, value });
    setQueryParams((next) => {
      next.delete("facultyId");
      next.delete("blockId");
      next.delete("roomId");
      next.set(key, value);
    });
  };

  const clearContext = () => {
    setActiveContext(null);
    setQueryParams((next) => {
      next.delete("facultyId");
      next.delete("blockId");
      next.delete("roomId");
    });
  };

  const fetchClassList = async () => {
    return getSchedulerMapperClassList(academicTermId, {
      facultyId: selectedFacultyId,
      blockId: selectedBlockId,
      roomId: selectedRoomId,
    });
  };

  const fetchLookups = async (academicTermId: string) => {
    const [courseLoadingModule, roomModule] = await Promise.all([
      import("@/lib/course-loading/queries"),
      import("@/lib/admin/rooms"),
    ]);

    const [facultyRows, roomRows, blockRows] = await Promise.all([
      courseLoadingModule.getFacultyListByTerm(academicTermId),
      roomModule.getRooms(),
      courseLoadingModule.getBlockListByTerm(academicTermId),
    ]);

    return { facultyRows, roomRows, blockRows };
  };

  //#region Effects

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      const { facultyRows, roomRows, blockRows } = await fetchLookups(academicTermId);

      if (cancelled) return;

      setFaculty(facultyRows);
      setRooms(roomRows);
      setBlocks(blockRows);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [academicTermId]);

  useEffect(() => {
    setActiveContext(getActiveContextFromSearchParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const rows = await fetchClassList();
      if (cancelled) return;
      setClasses(rows);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [academicTermId, selectedFacultyId, selectedBlockId, selectedRoomId]);

  return (
    <>
      <ClassList
        selectedFaculty={selectedFaculty}
        selectedBlock={selectedBlock}
        selectedRoom={selectedRoom}
        onFacultyClick={() => setShowFacultyDialog(true)}
        onBlockClick={() => setShowBlockDialog(true)}
        onRoomClick={() => setShowRoomDialog(true)}
        classes={classes}
        onClearContext={clearContext}
        loading={loading}
        onClassScheduleChange={async () => {
          const rows = await fetchClassList();
          setClasses(rows);
        }}
      />

      <SelectFacultyDialog
        open={showFacultyDialog}
        onOpenChange={setShowFacultyDialog}
        faculty={faculty}
        selectedFacultyId={selectedFacultyId}
        onSelectFaculty={(facultyId) => {
          setContextParam("facultyId", facultyId);
          setShowFacultyDialog(false);
        }}
      />

      <SelectBlockDialog
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        blocks={blocks}
        selectedBlockId={selectedBlockId}
        onSelectBlock={(blockId: string) => {
          setContextParam("blockId", blockId);
          setShowBlockDialog(false);
        }}
      />

      <SelectRoomDialog
        open={showRoomDialog}
        onOpenChange={setShowRoomDialog}
        rooms={rooms}
        selectedRoomId={selectedRoomId}
        onSelectRoom={(roomId: string) => {
          setContextParam("roomId", roomId);
          setShowRoomDialog(false);
        }}
      />
    </>
  );
};

export default MapperLeftPane;
