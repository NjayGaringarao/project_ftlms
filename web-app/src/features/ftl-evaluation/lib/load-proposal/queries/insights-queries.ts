"use server";

import { getUserDataList } from "@/features/profile/lib/user-data/queries";
import {
  classifyLoadBand,
  computeCampusLoadDistribution,
} from "@/features/ftl-evaluation/lib/load-proposal/derivations";
import type {
  CampusEtlAtlFacultyMetric,
  CampusLoadInsightsBundle,
} from "@/features/ftl-evaluation/lib/load-proposal/read-models";
import { getLatestIndividualProposalsByCampusTerm } from "./list-queries";
import { getCampusLoadReviewBundle } from "./review-queries";

export const getCampusLoadInsightsBundle = async (
  campusId: string,
  academicTermId: string,
): Promise<CampusLoadInsightsBundle> => {
  const [reviewBundle, userDataRows, latestIndividualProposals] =
    await Promise.all([
      getCampusLoadReviewBundle(campusId, academicTermId),
      getUserDataList({
        academicTermId,
        includeLoads: true,
      }),
      getLatestIndividualProposalsByCampusTerm(campusId, academicTermId),
    ]);

  const userDataById = new Map(userDataRows.map((row) => [row.id, row]));

  const etlAtlPerFaculty = latestIndividualProposals
    .map((proposalRow) => {
      const userData = userDataById.get(proposalRow.user_id);
      const etl = Number(userData?.designationLoad ?? 0);
      const atl = Number(userData?.actualTeachingLoad ?? 0);
      const twl = Number(userData?.totalWorkingLoad ?? etl + atl);
      return {
        faculty_id: proposalRow.user_id,
        faculty_name:
          userData?.identity?.name ??
          proposalRow.faculty_name ??
          "Unknown Faculty",
        etl,
        atl,
        twl,
        load_band: classifyLoadBand(twl),
      } satisfies CampusEtlAtlFacultyMetric;
    })
    .sort((a, b) => a.faculty_name.localeCompare(b.faculty_name));

  const approvedIndividualCount =
    reviewBundle.currentIndividualProposals.filter(
      (item) => item.lifecycle_status === "APPROVED",
    ).length;

  const activeIndividualCount = reviewBundle.currentIndividualProposals.filter(
    (item) => item.lifecycle_status === "ACTIVE",
  ).length;

  return {
    ...reviewBundle,
    approvedIndividualCount,
    activeIndividualCount,
    liveLoadDistribution: computeCampusLoadDistribution(etlAtlPerFaculty),
    etlAtlPerFaculty,
    latestIndividualProposals,
  };
};
