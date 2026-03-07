"use server";

import { Rank } from "@/models/academic_rank";
import { createClient } from "@/utils/supabase/server";

export type RankListItem = Pick<
  Rank,
  "id" | "number" | "title" | "description"
>;

export const getUniversityRanksList = async (): Promise<RankListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("academic_rank")
    .select("id, number, title, description")
    .order("number", { ascending: true });

  if (error) {
    console.error("lib.admin.ranks.getUniversityRanksList ::", error);
    return [];
  }

  return (data ?? []) as RankListItem[];
};

export const getRankById = async (rankId: string): Promise<Rank | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("academic_rank")
    .select("id, number, title, description")
    .eq("id", rankId)
    .maybeSingle();

  if (error) {
    console.error("lib.admin.ranks.getRankById ::", error);
    return null;
  }

  return (data ?? null) as Rank | null;
};
