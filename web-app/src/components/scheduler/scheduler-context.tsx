"use client";

import { createContext, useContext } from "react";
import type { SessionType } from "@/models";
import type { SchedulerCourseOfferingItem } from "@/lib/schedule/course-offerings";
import type {
  CourseLoadingBlockListItem,
  FacultyListItem,
} from "@/lib/course-loading/types";
import type { SessionSummary } from "@/lib/schedule/session-actions";
import type { SchedulerMatrixSession } from "@/lib/schedule/mapper";
import type { ExtendedRoom } from "@/models";

export type SchedulerContextValue = {
  blocks: CourseLoadingBlockListItem[];
  rooms: ExtendedRoom[];
  offerings: SchedulerCourseOfferingItem[];
  blockSessions: SchedulerMatrixSession[];
  facultySessions: SchedulerMatrixSession[];
  roomSessions: SchedulerMatrixSession[];
  selectedBlockId: string | null;
  selectedFacultyId: string | null;
  selectedRoomId: string | null;
  selectedOffering: SchedulerCourseOfferingItem | null;
  sessionType: SessionType;
  setSessionType: (type: SessionType) => void;
  selectedSessionId: string | null;
  selectedClassId: string | null;
  classRefreshKey: number;
  overlappingSessions: SessionSummary[];
  selectSession: (sessionId: string | null, classId?: string | null) => void;
  clearSelection: () => void;
  facultyOptions: FacultyListItem[];
  refreshSessions: () => void;
  errorMessage?: string | null;
};

const SchedulerContext = createContext<SchedulerContextValue | null>(null);

export const SchedulerProvider = SchedulerContext.Provider;

export const useScheduler = (): SchedulerContextValue => {
  const context = useContext(SchedulerContext);
  if (!context) {
    throw new Error("useScheduler must be used within SchedulerProvider");
  }
  return context;
};
