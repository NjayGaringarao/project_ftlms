"use server";

import { createClient } from "@/utils/supabase/server";
import { Identity } from "@/models/identity";

export type UsersListItem = {
  id: string;
  email: string | null;
  employment_status: string | null;
  identity: Identity | null;
};

export type UserDetail = UsersListItem;

type UsersRpcRow = {
  id: string;
  email: string | null;
  employment_status: string | null;
  identity_user_id: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  extension: string | null;
  birth_date: string | null;
  address: string | null;
  zip_code: string | null;
  contact_number: string | null;
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

  return mapRowToUser(data[0] as UsersRpcRow);
};
