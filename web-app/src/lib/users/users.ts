"use server";

import { createClient } from "@/utils/supabase/server";
import { Identity } from "@/models/identity";
import { AcademicRank } from "@/models/academic_rank";
import { ExtendedDesignation } from "@/models/designation";
import { Degree } from "@/models/degree";

export type UsersListItem = {
  id: string;
  email: string | null;
  employment_status: string | null;
  identity: Identity | null;
};

export type UserDetail = UsersListItem & {
  rank: AcademicRank | null;
  designations: ExtendedDesignation[];
  degrees: Degree[];
};

type UsersRpcRow = {
  id: string;
  email: string | null;
  employment_status: string | null;
  academic_rank_id: string | null;
  academic_rank_number: number | null;
  academic_rank_title: string | null;
  academic_rank_description: string | null;
  identity_user_id: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  extension: string | null;
  birth_date: string | null;
  address: string | null;
  zip_code: string | null;
  contact_number: string | null;
  designations: string; // JSON string
  degrees: string; // JSON string
};

const mapRowToUser = (row: UsersRpcRow): UsersListItem => {
  const identity = row.identity_user_id
    ? {
        user_id: row.identity_user_id,
        first_name: row.first_name ?? "",
        middle_name: row.middle_name ?? null,
        last_name: row.last_name ?? "",
        extension: row.extension ?? null,
        birth_date: row.birth_date ?? "",
        address: row.address ?? null,
        zip_code: row.zip_code ?? null,
        contact_number: row.contact_number ?? null,
      }
    : null;

  return {
    id: row.id,
    email: row.email ?? null,
    employment_status: row.employment_status ?? null,
    identity: identity as Identity | null,
  };
};

const mapRowToUserDetail = (row: UsersRpcRow): UserDetail => {
  const baseUser = mapRowToUser(row);

  const rank: AcademicRank | null = row.academic_rank_id
    ? {
        id: row.academic_rank_id,
        number: row.academic_rank_number ?? 0,
        title: row.academic_rank_title ?? "",
        description: row.academic_rank_description ?? "",
      }
    : null;

  let designations: ExtendedDesignation[] = [];
  let degrees: Degree[] = [];

  try {
    if (typeof row.designations === "string") {
      designations = JSON.parse(row.designations) as ExtendedDesignation[];
    } else if (Array.isArray(row.designations)) {
      designations = row.designations as ExtendedDesignation[];
    }
  } catch (e) {
    console.error("Failed to parse designations JSON:", e);
    designations = [];
  }

  try {
    if (typeof row.degrees === "string") {
      degrees = JSON.parse(row.degrees) as Degree[];
    } else if (Array.isArray(row.degrees)) {
      degrees = row.degrees as Degree[];
    }
  } catch (e) {
    console.error("Failed to parse degrees JSON:", e);
    degrees = [];
  }

  return {
    ...baseUser,
    rank,
    designations,
    degrees,
  };
};

export const getUsersList = async (): Promise<UsersListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_users_with_identity");

  if (error) {
    console.error("lib.users.getUsersList ::", error);
    return [];
  }

  return (data ?? []).map((row: UsersRpcRow) => mapRowToUser(row));
};

export const getUserById = async (
  userId: string,
): Promise<UserDetail | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_users_with_identity", {
    filter_user_id: userId,
  });

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("lib.users.getUserById ::", error);
    return null;
  }

  if (!data || data.length === 0) return null;

  return mapRowToUserDetail(data[0] as UsersRpcRow);
};

export const getRanks = async (): Promise<AcademicRank[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("academic_rank")
    .select("*")
    .order("number", { ascending: true });

  if (error) {
    console.error("lib.users.getRanks ::", error);
    return [];
  }

  return (data ?? []) as AcademicRank[];
};
