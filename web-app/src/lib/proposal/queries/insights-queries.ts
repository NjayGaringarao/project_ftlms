"use server";

import { getUserDataList } from "@/lib/user-data/queries";
import {
  classifyLoadBand,
  computeCampusLoadDistribution,
} from "@/lib/proposal/derivations";
import type {
  CampusEtlAtlFacultyMetric,
  CampusProposalInsightsBundle,
} from "@/lib/proposal/read-models";
import { getLatestIndividualProposalsByCampusTerm } from "./list-queries";
import { getCampusProposalReviewBundle } from "./review-queries";

export const getCampusProposalInsightsBundle = async (
  campusId: string,
  academicTermId: string,
): Promise<CampusProposalInsightsBundle> => {
  const [reviewBundle, userDataRows, latestIndividualProposals] =
    await Promise.all([
      getCampusProposalReviewBundle(campusId, academicTermId),
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
