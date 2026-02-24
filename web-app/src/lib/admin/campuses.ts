"use server";

import { Campus } from "@/models/campus";
import { createClient } from "@/utils/supabase/server";

export type CampusListItem = Pick<
  Campus,
  "id" | "name" | "address" | "zip_code"
>;

export type DirectorOption = {
  id: string;
  name: string;
  email: string | null;
};

type UserIdentityRpcRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  extension: string | null;
};

const mapDirectorDisplayName = (row: UserIdentityRpcRow) => {
  const parts = [
    row.first_name,
    row.middle_name,
    row.last_name,
    row.extension,
  ].filter(Boolean);
  const name = parts.join(" ").trim();

  if (name) return name;
  if (row.email) return row.email;
  return "Unknown User";
};

export const getCampusesList = async (): Promise<CampusListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campus")
    .select("id, name, address, zip_code")
    .order("name", { ascending: true });

  if (error) {
    console.error("lib.admin.campuses.getCampusesList ::", error);
    return [];
  }

  return (data ?? []) as CampusListItem[];
};

export const getCampusById = async (
  campusId: string,
): Promise<Campus | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campus")
    .select("id, name, address, zip_code")
    .eq("id", campusId)
    .maybeSingle();

  if (error) {
    console.error("lib.admin.campuses.getCampusById ::", error);
    return null;
  }

  return (data ?? null) as Campus | null;
};

export const getDirectorOptions = async (): Promise<DirectorOption[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_users_with_identity");

  if (error) {
    console.error("lib.admin.campuses.getDirectorOptions ::", error);
    return [];
  }

  const uniqueUsers = new Map<string, DirectorOption>();

  (data ?? []).forEach((row: UserIdentityRpcRow) => {
    if (!row.id) return;

    if (!uniqueUsers.has(row.id)) {
      uniqueUsers.set(row.id, {
        id: row.id,
        name: mapDirectorDisplayName(row),
        email: row.email ?? null,
      });
    }
  });

  return Array.from(uniqueUsers.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
};
