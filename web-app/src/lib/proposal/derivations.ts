import type { ProposalStatusFilter } from "@/lib/proposal/types";
import type {
  CampusEtlAtlFacultyMetric,
  CampusLoadBand,
  CampusLoadDistribution,
  ProposalLifecycleLike,
} from "@/lib/proposal/read-models";

export const toProposalFilterStatus = (
  lifecycleStatus: ProposalLifecycleLike,
): ProposalStatusFilter => {
  if (lifecycleStatus === "ACTIVE") return "PENDING";
  if (lifecycleStatus === "APPROVED") return "APPROVED";
  if (lifecycleStatus === "REJECTED") return "REJECTED";
  if (lifecycleStatus === "INVALIDATED") return "INVALIDATED";
  return "NO_PROPOSAL";
};

export const classifyLoadBand = (twl: number): CampusLoadBand => {
  if (twl > 24) return "OVERLOAD";
  if (twl < 21) return "UNDERLOAD";
  return "NORMAL";
};

export const computeCampusLoadDistribution = (
  rows: CampusEtlAtlFacultyMetric[],
): CampusLoadDistribution => {
  return rows.reduce(
    (acc, item) => {
      if (item.load_band === "OVERLOAD") acc.overload += 1;
      if (item.load_band === "UNDERLOAD") acc.underload += 1;
      if (item.load_band === "NORMAL") acc.normal += 1;
      acc.total += 1;
      return acc;
    },
    {
      overload: 0,
      underload: 0,
      normal: 0,
      total: 0,
    } satisfies CampusLoadDistribution,
  );
};
