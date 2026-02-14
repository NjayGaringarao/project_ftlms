"use server";

import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { Identity } from "@/models/identity";
import { ExtendedDesignation } from "@/models/designation";
import { Rank } from "@/models/rank";
import { User } from "@/models/user";

export type IdentityUpdateInput = {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  extension?: string | null;
  birth_date: string;
  address?: string | null;
  zip_code?: string | null;
  contact_number?: string | null;
};

export const getIdentityByUserId = async (
  userId: string,
): Promise<Identity | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("identity")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("lib.me.profile.getIdentityByUserId ::", error);
    return null;
  }

  return data as Identity;
};

export async function getIdentityForCurrentUser(): Promise<Identity | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return getIdentityByUserId(user.id);
}

export async function upsertIdentityForCurrentUser(
  input: IdentityUpdateInput,
): Promise<{ data?: Identity; error?: string }> {
  const user = await getCurrentUser();

  if (!user) return { error: "Not authenticated" };

  if (!input.first_name?.trim()) return { error: "First name is required" };

  if (!input.last_name?.trim()) return { error: "Last name is required" };

  if (!input.birth_date?.trim()) return { error: "Birth date is required" };

  const supabase = await createClient();

  const payload: Identity = {
    user_id: user.id,
    first_name: input.first_name.trim(),
    middle_name: input.middle_name ?? null,
    last_name: input.last_name.trim(),
    extension: input.extension ?? null,
    birth_date: input.birth_date,
    address: input.address ?? null,
    zip_code: input.zip_code ?? null,
    contact_number: input.contact_number ?? null,
  };

  const { data, error } = await supabase
    .from("identity")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: data as Identity };
}

export type ProfessionalInfo = {
  user: User | null;
  rank: Rank | null;
  designations: ExtendedDesignation[];
};

export const getProfessionalInfoByUserId = async (
  userId: string,
): Promise<ProfessionalInfo> => {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase
    .from("user")
    .select(
      "id, rank_id, employment_status, rank ( id, number, title, description )",
    )
    .eq("id", userId)
    .single();

  if (userError && userError.code !== "PGRST116") {
    console.error(
      "lib.me.profile.getProfessionalInfoByUserId.user ::",
      userError,
    );
  }

  const user: User | null = userData
    ? {
        id: userData.id,
        rank_id: userData.rank_id,
        employment_status: userData.employment_status,
      }
    : null;

  const rank: Rank | null = userData?.rank
    ? Array.isArray(userData.rank)
      ? (userData.rank[0] as Rank)
      : (userData.rank as Rank)
    : null;

  const { data: designationData, error: designationError } = await supabase
    .from("designation")
    .select(
      "id, user_id, campus_id, position, department, load, campus ( id, director_id, name, address, zip_code )",
    )
    .eq("user_id", userId)
    .order("position", { ascending: true });

  if (designationError) {
    console.error(
      "lib.me.profile.getProfessionalInfoByUserId.designations ::",
      designationError,
    );
  }

  const designations = (designationData ?? []).map((d: any) => ({
    ...d,
    campus: Array.isArray(d.campus) ? (d.campus[0] ?? null) : d.campus,
  })) as ExtendedDesignation[];

  return {
    user,
    rank,
    designations,
  };
};

export async function getProfessionalInfoForCurrentUser(): Promise<ProfessionalInfo> {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, rank: null, designations: [] };
  }

  return getProfessionalInfoByUserId(user.id);
}
