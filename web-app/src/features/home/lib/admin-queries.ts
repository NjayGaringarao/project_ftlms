"use server";

import { getUserDataList } from "@/features/profile/lib/user-data/queries";
import { createClient } from "@/utils/supabase/server";
import { sortByValueDesc } from "./load-math";
import { countUsers, getEmploymentMix } from "./shared-queries";
import { AdminInsights, LabelValue } from "./types";

const LEADERSHIP_TITLES: Array<{ title: string; short: string }> = [
  { title: "Vice President for Academic Affairs", short: "VPAA" },
  { title: "Director for Instruction", short: "DI" },
  { title: "Campus Director", short: "CD" },
  { title: "College Dean", short: "Dean" },
  { title: "Program Chairperson", short: "PC" },
];

// Compact rank titles for narrow screens — words (not codes) so the
// category axis can wrap them cleanly.
const shortenRankTitle = (title: string): string =>
  title
    .replace("Assistant Professor", "Asst Prof")
    .replace("Associate Professor", "Assoc Prof")
    .replace("University Professor", "Univ Prof")
    .replace("College Professor", "Col Prof")
    .replace("Instructor", "Inst");

const emptyInsights: AdminInsights = {
  employmentMix: [],
  usersPerCampus: [],
  rankDistribution: [],
  leadershipBreakdown: [],
  accountHealth: {
    totalUsers: 0,
    confirmedEmails: 0,
    signIns7d: 0,
    signIns30d: 0,
  },
};

export const getAdminInsights = async (): Promise<AdminInsights> => {
  const supabase = await createClient();

  try {
    const [campusesResult, ranksResult, designationsResult, users] =
      await Promise.all([
        supabase.from("campus").select("id, code, name").order("name"),
        supabase.from("academic_rank").select("id, title").order("title"),
        supabase.from("designation").select("job_title, user_id"),
        getUserDataList(),
      ]);

    if (campusesResult.error) {
      console.error(
        "lib.home.admin-queries.campuses ::",
        campusesResult.error,
      );
    }
    if (ranksResult.error) {
      console.error("lib.home.admin-queries.ranks ::", ranksResult.error);
    }
    if (designationsResult.error) {
      console.error(
        "lib.home.admin-queries.designations ::",
        designationsResult.error,
      );
    }

    const campuses = campusesResult.data ?? [];
    const ranks = ranksResult.data ?? [];
    const designations = designationsResult.data ?? [];

    const [employmentMix, campusCounts, rankCounts, totalUsers] =
      await Promise.all([
        getEmploymentMix(),
        Promise.all(
          campuses.map((campus) => countUsers({ campus_id: campus.id })),
        ),
        Promise.all(
          ranks.map((rank) => countUsers({ academic_rank_id: rank.id })),
        ),
        countUsers({}),
      ]);

    const usersPerCampus = sortByValueDesc(
      campuses
        .map((campus, index) => ({
          label: campus.code || campus.name,
          value: campusCounts[index],
        }))
        .filter((entry) => entry.value > 0),
    );

    const rankDistribution = sortByValueDesc(
      ranks
        .map((rank, index) => ({
          label: rank.title,
          shortLabel: shortenRankTitle(rank.title),
          value: rankCounts[index],
        }))
        .filter((entry) => entry.value > 0),
    );

    const leadershipCounts = new Map<string, number>();
    const designatedUserIds = new Set<string>();
    designations.forEach((designation) => {
      designatedUserIds.add(designation.user_id);
      leadershipCounts.set(
        designation.job_title,
        (leadershipCounts.get(designation.job_title) ?? 0) + 1,
      );
    });
    const leadershipBreakdown: LabelValue[] = [
      ...LEADERSHIP_TITLES.map(({ title, short }) => ({
        label: title,
        shortLabel: short,
        value: leadershipCounts.get(title) ?? 0,
      })).filter((entry) => entry.value > 0),
      {
        label: "Faculty (no designation)",
        shortLabel: "Faculty",
        value: Math.max(totalUsers - designatedUserIds.size, 0),
      },
    ];

    const now = Date.now();
    const daysAgo = (value: string | null): number =>
      value ? (now - new Date(value).getTime()) / (1000 * 60 * 60 * 24) : Infinity;

    return {
      employmentMix,
      usersPerCampus,
      rankDistribution,
      leadershipBreakdown,
      accountHealth: {
        totalUsers,
        confirmedEmails: users.filter((user) => user.emailConfirmedAt).length,
        signIns7d: users.filter((user) => daysAgo(user.lastSignInAt) <= 7)
          .length,
        signIns30d: users.filter((user) => daysAgo(user.lastSignInAt) <= 30)
          .length,
      },
    };
  } catch (error) {
    console.error("lib.home.admin-queries.getAdminInsights ::", error);
    return emptyInsights;
  }
};
