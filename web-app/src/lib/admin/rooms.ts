"use server";

import { ExtendedRoom } from "@/models/room";
import { createClient } from "@/utils/supabase/server";

export const getRooms = async (): Promise<ExtendedRoom[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("room")
    .select(
      `
      id,
      code,
      name,
      capacity,
      campus_id,
      campus:campus_id (id, code, name, address)
      `,
    )
    .order("code", { ascending: true });

  if (error) {
    console.error("lib.admin.rooms.getRooms ::", error);
    return [];
  }

  const rooms = (data ?? []).map((r) => ({
    ...r,
    campus: Array.isArray(r.campus) ? r.campus[0] : r.campus,
  })) as ExtendedRoom[];

  return rooms;
};

export const getRoomsByCampus = async (
  campusId: string,
): Promise<ExtendedRoom[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("room")
    .select(
      `
      id,
      code,
      name,
      capacity,
      campus_id,
      campus:campus_id (id, code, name, address)
      `,
    )
    .eq("campus_id", campusId)
    .order("code", { ascending: true });

  if (error) {
    console.error("lib.admin.rooms.getRoomsByCampus ::", error);
    return [];
  }

  const rooms = (data ?? []).map((r) => ({
    ...r,
    campus: Array.isArray(r.campus) ? r.campus[0] : r.campus,
  })) as ExtendedRoom[];

  return rooms;
};

export const getRoomById = async (
  roomId: string,
): Promise<ExtendedRoom | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("room")
    .select(
      `
      id,
      code,
      name,
      capacity,
      campus_id,
      campus:campus_id (id, code, name, address)
      `,
    )
    .eq("id", roomId)
    .maybeSingle();

  if (error) {
    console.error("lib.admin.rooms.getRoomById ::", error);
    return null;
  }

  if (!data) return null;

  const room: ExtendedRoom = {
    ...data,
    campus: Array.isArray(data.campus) ? data.campus[0] : data.campus,
  };

  return room;
};
