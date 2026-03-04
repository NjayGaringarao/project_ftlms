"use server";

import { createClient } from "@/utils/supabase/server";

const STALE_ERROR =
  "This schedule was updated by another editor. Reload to avoid overwriting recent changes.";

export const touchSchedule = async (scheduleId: string) => {
  const supabase = await createClient();
  await supabase
    .from("schedule")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", scheduleId);
};

export const assertScheduleIsFresh = async (
  scheduleId: string,
  expectedUpdatedAt: string | null,
  forceStaleSave: boolean,
) => {
  if (forceStaleSave) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedule")
    .select("updated_at")
    .eq("id", scheduleId)
    .single();

  if (error) {
    console.error("lib.ftl.assertScheduleIsFresh ::", error);
    return "Unable to validate schedule freshness";
  }

  const latest = data?.updated_at ?? null;
  if (latest && expectedUpdatedAt && latest !== expectedUpdatedAt) {
    return STALE_ERROR;
  }

  return null;
};
