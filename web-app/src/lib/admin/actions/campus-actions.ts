"use server";

import { createClient } from "@/utils/supabase/server";
import {
  mapDuplicateError,
  normalizeCode,
  normalizeDescription,
  normalizeName,
  revalidateCampusesPaths,
  revalidateCampusRoomsPaths,
} from "./shared";

type CampusInput = {
  code: string;
  name: string;
  address?: string | null;
};

type UpdateCampusInput = CampusInput & {
  id: string;
};

const normalizeCampusInput = (input: CampusInput) => ({
  code: normalizeCode(input.code),
  name: normalizeName(input.name),
  address: normalizeDescription(input.address),
});

export async function createCampus(
  input: CampusInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.code?.trim()) return { error: "Campus code is required" };
  if (!input.name?.trim()) return { error: "Campus name is required" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campus")
    .insert(normalizeCampusInput(input))
    .select("id")
    .single();

  if (error) {
    return { error: mapDuplicateError("Campus", "name", error) };
  }

  revalidateCampusesPaths(data.id);
  return { data: { id: data.id } };
}

export async function updateCampus(
  input: UpdateCampusInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Campus ID is required" };
  if (!input.code?.trim()) return { error: "Campus code is required" };
  if (!input.name?.trim()) return { error: "Campus name is required" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("campus")
    .update(normalizeCampusInput(input))
    .eq("id", input.id);

  if (error) {
    return { error: mapDuplicateError("Campus", "name", error) };
  }

  revalidateCampusesPaths(input.id);
  return { data: true };
}

export async function deleteCampus(
  campusId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!campusId?.trim()) return { error: "Campus ID is required" };

  const supabase = await createClient();

  const { error } = await supabase.from("campus").delete().eq("id", campusId);

  if (error) {
    return { error: error.message };
  }

  revalidateCampusesPaths();
  return { data: true };
}

type RoomInput = {
  campus_id: string;
  code: string;
  name?: string | null;
  capacity?: number | null;
};

type UpdateRoomInput = RoomInput & {
  id: string;
};

const normalizeRoomInput = (input: RoomInput) => ({
  campus_id: input.campus_id.trim(),
  code: normalizeCode(input.code),
  name: normalizeDescription(input.name),
  capacity: input.capacity ?? null,
});

export async function createRoom(
  input: RoomInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.campus_id?.trim()) return { error: "Campus is required" };
  if (!input.code?.trim()) return { error: "Room code is required" };
  if (
    input.capacity !== undefined &&
    input.capacity !== null &&
    (!Number.isInteger(input.capacity) || input.capacity < 0)
  ) {
    return { error: "Room capacity must be a whole number zero or greater" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("room")
    .insert(normalizeRoomInput(input))
    .select("id")
    .single();

  if (error) {
    return { error: mapDuplicateError("Room", "code in this campus", error) };
  }

  revalidateCampusRoomsPaths(input.campus_id, data.id);
  return { data: { id: data.id } };
}

export async function updateRoom(
  input: UpdateRoomInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Room ID is required" };
  if (!input.campus_id?.trim()) return { error: "Campus is required" };
  if (!input.code?.trim()) return { error: "Room code is required" };
  if (
    input.capacity !== undefined &&
    input.capacity !== null &&
    (!Number.isInteger(input.capacity) || input.capacity < 0)
  ) {
    return { error: "Room capacity must be a whole number zero or greater" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("room")
    .update(normalizeRoomInput(input))
    .eq("id", input.id);

  if (error) {
    return { error: mapDuplicateError("Room", "code in this campus", error) };
  }

  revalidateCampusRoomsPaths(input.campus_id, input.id);
  return { data: true };
}

export async function deleteRoom(
  roomId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!roomId?.trim()) return { error: "Room ID is required" };

  const supabase = await createClient();

  const { data: existingRoom } = await supabase
    .from("room")
    .select("id, campus_id")
    .eq("id", roomId)
    .maybeSingle();

  if (!existingRoom) {
    return { error: "Room not found" };
  }

  const [
    { count: sessionCount, error: sessionCountError },
    { count: designationCount, error: designationCountError },
  ] = await Promise.all([
    supabase
      .from("session")
      .select("id", { count: "exact", head: true })
      .eq("room_id", roomId),
    supabase
      .from("designation")
      .select("id", { count: "exact", head: true })
      .eq("room_id", roomId),
  ]);

  if (sessionCountError) return { error: sessionCountError.message };
  if (designationCountError) return { error: designationCountError.message };

  const linkedSessions = sessionCount ?? 0;
  const linkedDesignations = designationCount ?? 0;

  if (linkedSessions > 0 || linkedDesignations > 0) {
    return {
      error:
        "Cannot delete room while sessions or designations are still attached. Remove or reassign dependent records first.",
    };
  }

  const { error } = await supabase.from("room").delete().eq("id", roomId);

  if (error) {
    return { error: error.message };
  }

  revalidateCampusRoomsPaths(existingRoom.campus_id);
  return { data: true };
}
