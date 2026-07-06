import { TermListItem } from "@/features/admin/lib/terms";
import { UserRole } from "@/features/shared/types/models";
import type {
  CampusCollegeLoadStatus,
  CampusCollegeLoadStep,
} from "@/features/shared/types/models/campus_college_load";

export type LabelValue = {
  label: string;
  value: number;
};

export type DashboardScope = {
  programOfferingIds: string[];
  chairPairs: Array<{ campusId: string; collegeId: string }>;
  collegeIds: string[];
  campusIds: string[];
};

export type DashboardContext = {
  userId: string;
  firstName: string | null;
  role: UserRole;
  term: TermListItem | null;
  scope: DashboardScope;
};

export type FtlStatusItem = {
  id: string | null;
  scopeLabel: string;
  status: CampusCollegeLoadStatus | null;
  step: CampusCollegeLoadStep | null;
  latestSubmittedAt: string | null;
  hasReturnComments: boolean;
};

export type AdminInsights = {
  employmentMix: LabelValue[];
  usersPerCampus: LabelValue[];
  rankDistribution: LabelValue[];
  leadershipBreakdown: LabelValue[];
  accountHealth: {
    totalUsers: number;
    confirmedEmails: number;
    signIns7d: number;
    signIns30d: number;
  };
};

export type ChairInsights = {
  ftl: FtlStatusItem[];
  sectionsByYearLevel: LabelValue[];
  totalSections: number;
  totalStudents: number;
  facultyLoads: LabelValue[];
  unassigned: {
    withoutFaculty: number;
    withoutSchedule: number;
    sampleCourseCodes: string[];
  };
  sessionMix: { lecture: number; laboratory: number };
};

export type DeanInsights = {
  ftl: FtlStatusItem[];
  sectionsPerCampus: LabelValue[];
  totalSections: number;
  totalStudents: number;
  employmentMix: LabelValue[];
  topFacultyLoads: LabelValue[];
};

export type CampusDirectorInsights = {
  ftl: FtlStatusItem[];
  employmentMix: LabelValue[];
  roomUtilization: LabelValue[];
  sectionsPerCollege: LabelValue[];
  totalSections: number;
  totalStudents: number;
};

export type ExecutiveActionItem = {
  loadId: string;
  scopeLabel: string;
  submittedAt: string | null;
};

export type ExecutiveInsights = {
  statusCounts: {
    draft: number;
    submitted: number;
    returned: number;
    approved: number;
  };
  stepCounts: LabelValue[];
  awaitingEvaluation: ExecutiveActionItem[];
  campusComparison: Array<{
    label: string;
    sections: number;
    students: number;
  }>;
  employmentMix: LabelValue[];
};
