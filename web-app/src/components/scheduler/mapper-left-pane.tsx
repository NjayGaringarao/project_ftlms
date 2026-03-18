"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getSchedulerMapperClassListByBlock,
  getSchedulerMapperClassListByFaculty,
  getSchedulerMapperClassListByRoom,
  type SchedulerMapperClassListItem,
} from "@/lib/schedule/mapper";
import ClassList from "./class-list";
import { getSelectedContextsFromSearchParams } from "./utils";

type MapperLeftPaneProps = {
  academicTermId: string;
};


const MapperLeftPane = ({ academicTermId }: MapperLeftPaneProps) => {
  const searchParams = useSearchParams();
  const [classes, setClasses] = useState<SchedulerMapperClassListItem[]>([]);
  const [loading, setLoading] = useState(false);

  //#region Precomputed values
  const selectedContexts = getSelectedContextsFromSearchParams(searchParams);
  const selectedFacultyId = selectedContexts.facultyId ?? null;
  const selectedBlockId = selectedContexts.blockId ?? null;
  const selectedRoomId = selectedContexts.roomId ?? null;

  const fetchClassList = async () => {
    const requests: Array<Promise<SchedulerMapperClassListItem[]>> = [];

    if (selectedFacultyId) {
      requests.push(getSchedulerMapperClassListByFaculty(academicTermId, selectedFacultyId));
    }
    if (selectedBlockId) {
      requests.push(getSchedulerMapperClassListByBlock(academicTermId, selectedBlockId));
    }
    if (selectedRoomId) {
      requests.push(getSchedulerMapperClassListByRoom(academicTermId, selectedRoomId));
    }

    if (requests.length === 0) return [];

    if (requests.length === 1) {
      return requests[0];
    }

    const results = await Promise.all(requests);

    const map = new Map<string, SchedulerMapperClassListItem>();
    results.flat().forEach((item) => {
      map.set(item.id, item);
    });

    return Array.from(map.values());
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const rows = await fetchClassList();
      if (cancelled) return;
      setClasses(rows);
      setLoading(false);
    };

    setLoading(true);
    void load();

    return () => {
      cancelled = true;
    };
  }, [academicTermId, selectedFacultyId, selectedBlockId, selectedRoomId]);

  return (
    <>
      <ClassList
        classes={classes}
        loading={loading}
        onClassScheduleChange={async () => {
          const rows = await fetchClassList();
          setClasses(rows);
        }}
      />
    </>
  );
};

export default MapperLeftPane;
