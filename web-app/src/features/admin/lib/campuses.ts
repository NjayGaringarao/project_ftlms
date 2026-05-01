"use server";

import { Campus } from "@/features/shared/types/models/campus";
import { createClient } from "@/utils/supabase/server";
import { getUserDataList } from "@/features/profile/lib/user-data/queries";

export type CampusListItem = Pick<Campus, "id" | "code" | "name" | "address">;

export type DirectorOption = {
  id: string;
  name: string;
  email: string | null;
};

export const getCampusesList = async (): Promise<CampusListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campus")
    .select("id, code, name, address")
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
    .select("id, code, name, address")
    .eq("id", campusId)
    .maybeSingle();

  if (error) {
    console.error("lib.admin.campuses.getCampusById ::", error);
    return null;
  }

  return (data ?? null) as Campus | null;
};

export const getDirectorOptions = async (): Promise<DirectorOption[]> => {
  const uniqueUsers = new Map<string, DirectorOption>();
  const rows = await getUserDataList();

  rows.forEach((row) => {
    if (!row.id) return;
    if (!uniqueUsers.has(row.id)) {
      uniqueUsers.set(row.id, {
        id: row.id,
        name: row.identity?.name?.trim() || row.email || "Unknown User",
        email: row.email ?? null,
      });
    }
  });

  return Array.from(uniqueUsers.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
};
