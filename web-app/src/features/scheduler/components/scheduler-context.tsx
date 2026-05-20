"use client";

import { createContext, useContext } from "react";
import type { SessionType } from "@/features/shared/types/models";
import type { SchedulerCourseOfferingItem } from "@/features/scheduler/lib/schedule/course-offerings";
import type {
  CourseLoadingSectionListItem,
  FacultyListItem,
} from "@/features/course-loading/lib/types";
import type { SessionSummary } from "@/features/scheduler/lib/schedule/session-actions";
import type { SchedulerMatrixSession } from "@/features/scheduler/lib/schedule/mapper";
import type { ExtendedRoom } from "@/features/shared/types/models";

export type SchedulerContextValue = {
  sections: CourseLoadingSectionListItem[];
  rooms: ExtendedRoom[];
  offerings: SchedulerCourseOfferingItem[];
  sectionSessions: SchedulerMatrixSession[];
  facultySessions: SchedulerMatrixSession[];
  roomSessions: SchedulerMatrixSession[];
  selectedSectionId: string | null;
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
  startMoveSession: (session: SessionSummary) => void;
  clearSelection: () => void;
  facultyOptions: FacultyListItem[];
  refreshSessions: () => void;
  movingSession: SessionSummary | null;
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
