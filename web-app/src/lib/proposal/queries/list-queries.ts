"use server";

import { createClient } from "@/utils/supabase/server";
import { getFacultyListByTerm } from "@/lib/course-loading/queries";
import type { Proposal, ProposalLifecycleStatus } from "@/models";
import { toProposalFilterStatus } from "@/lib/proposal/derivations";
import type { FacultyProposalListItem } from "@/lib/proposal/types";
import type { LatestCampusIndividualProposal } from "@/lib/proposal/read-models";

export const getFacultyProposalListByTerm = async (
  academicTermId: string,
  options?: { includeEmpty?: boolean },
): Promise<FacultyProposalListItem[]> => {
  const facultyList = await getFacultyListByTerm(academicTermId, {
    includeEmpty: options?.includeEmpty ?? false,
  });
  if (facultyList.length === 0) return [];

  const facultyIds = facultyList.map((item) => item.id);
  const supabase = await createClient();
  const { data: proposalRows, error } = await supabase
    .from("proposal")
    .select("id, user_id, lifecycle_status, created_at")
    .eq("academic_term_id", academicTermId)
    .in("user_id", facultyIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("proposal.getFacultyProposalListByTerm.proposals ::", error);
    return facultyList.map((item) => ({
      ...item,
      latest_proposal_id: null,
      latest_proposal_lifecycle_status: null,
      proposal_filter_status: "NO_PROPOSAL",
    }));
  }

  const latestProposalByFacultyId = new Map<
    string,
    {
      id: string;
      lifecycle_status: ProposalLifecycleStatus;
    }
  >();

  for (const row of proposalRows ?? []) {
    if (!row.user_id || latestProposalByFacultyId.has(row.user_id)) continue;
    latestProposalByFacultyId.set(row.user_id, {
      id: row.id,
      lifecycle_status: row.lifecycle_status as ProposalLifecycleStatus,
    });
  }

  return facultyList.map((item) => {
    const latestProposal = latestProposalByFacultyId.get(item.id) ?? null;
    const lifecycleStatus = latestProposal?.lifecycle_status ?? null;
    return {
      ...item,
      latest_proposal_id: latestProposal?.id ?? null,
      latest_proposal_lifecycle_status: lifecycleStatus,
      proposal_filter_status: toProposalFilterStatus(lifecycleStatus),
    };
  });
};

export const getLatestProposalByUserTerm = async (
  userId: string,
  academicTermId: string,
): Promise<Proposal | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("proposal")
    .select("*")
    .eq("user_id", userId)
    .eq("academic_term_id", academicTermId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("proposal.getLatestProposal ::", error);
    return null;
  }

  return data ?? null;
};

export const getLatestIndividualProposalsByCampusTerm = async (
  campusId: string,
  academicTermId: string,
): Promise<LatestCampusIndividualProposal[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("proposal")
    .select(
      `
      id,
      user_id,
      lifecycle_status,
      created_at,
      proposal_user:user_id (
        identity:identity (name)
      )
    `,
    )
    .eq("campus_id", campusId)
    .eq("academic_term_id", academicTermId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("proposal.getLatestIndividualProposalsByCampusTerm ::", error);
    return [];
  }

  const latestByFacultyId = new Map<string, LatestCampusIndividualProposal>();
  for (const row of data ?? []) {
    if (!row.user_id || latestByFacultyId.has(row.user_id)) continue;

    const proposalUser = Array.isArray(row.proposal_user)
      ? row.proposal_user[0]
      : row.proposal_user;
    const rawIdentity = proposalUser
      ? Array.isArray(proposalUser.identity)
        ? proposalUser.identity[0]
        : proposalUser.identity
      : null;

    latestByFacultyId.set(row.user_id, {
      id: row.id,
      user_id: row.user_id,
      lifecycle_status: row.lifecycle_status as ProposalLifecycleStatus,
      faculty_name:
        rawIdentity && typeof rawIdentity.name === "string"
          ? rawIdentity.name
          : null,
    });
  }

  return Array.from(latestByFacultyId.values());
};
