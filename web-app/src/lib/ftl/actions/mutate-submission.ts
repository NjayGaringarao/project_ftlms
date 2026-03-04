"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { MultiCampusSubmitResult, MutationResult } from "../types";
import { ensureProgramChair } from "./auth";

const touchSchedule = async (scheduleId: string) => {
  const supabase = await createClient();
  await supabase
    .from("schedule")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", scheduleId);
};

export const submitScheduleForCampusDirector = async (input: {
  schedule_id: string;
  campus_id: string;
}): Promise<MutationResult> => {
  await ensureProgramChair();
  const supabase = await createClient();

  const { data: designation, error: designationError } = await supabase
    .from("designation")
    .select("id")
    .eq("campus_id", input.campus_id)
    .ilike("job_title", "Campus Director")
    .order("designated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (designationError) {
    console.error(
      "lib.ftl.submitScheduleForCampusDirector designation::",
      designationError,
    );
    return {
      error: designationError.message ?? "Unable to resolve campus director",
    };
  }

  if (!designation?.id) {
    return {
      error:
        "No campus director designation found for this campus. Assign a campus director before submission.",
    };
  }

  const { error } = await supabase.from("evaluation").upsert(
    {
      designation_id: designation.id,
      schedule_id: input.schedule_id,
      evaluation_level: 0,
      evaluator_role: "CAMPUS_DIRECTOR",
      status: "PENDING",
      comment: null,
      created_at: new Date().toISOString(),
    },
    {
      onConflict: "designation_id,schedule_id",
      ignoreDuplicates: false,
    },
  );

  if (error) {
    console.error(
      "lib.ftl.submitScheduleForCampusDirector evaluation::",
      error,
    );
    return { error: error.message ?? "Unable to submit schedule" };
  }

  await touchSchedule(input.schedule_id);
  revalidatePath("/ftl");
  return { error: null };
};

export const submitScheduleForCampusDirectors = async (input: {
  schedule_id: string;
  campus_ids: string[];
}): Promise<MultiCampusSubmitResult> => {
  await ensureProgramChair();

  const campusIds = Array.from(new Set(input.campus_ids.filter(Boolean)));
  if (campusIds.length === 0) {
    return {
      error: "Select at least one campus before submission.",
      submitted_campus_count: 0,
      missing_directors: [],
    };
  }

  const supabase = await createClient();

  const { data: campuses, error: campusesError } = await supabase
    .from("campus")
    .select("id, name")
    .in("id", campusIds);

  if (campusesError) {
    console.error(
      "lib.ftl.submitScheduleForCampusDirectors campuses::",
      campusesError,
    );
    return {
      error: campusesError.message ?? "Unable to resolve selected campuses",
      submitted_campus_count: 0,
      missing_directors: [],
    };
  }

  const campusNameMap = new Map<string, string>(
    (campuses ?? []).map((item) => [item.id, item.name]),
  );

  const missing_directors: { campus_id: string; campus_name: string }[] = [];
  let submittedCount = 0;

  for (const campusId of campusIds) {
    const { data: designation, error: designationError } = await supabase
      .from("designation")
      .select("id")
      .eq("campus_id", campusId)
      .ilike("job_title", "Campus Director")
      .order("designated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (designationError) {
      console.error(
        "lib.ftl.submitScheduleForCampusDirectors designation::",
        designationError,
      );
      return {
        error: designationError.message ?? "Unable to resolve campus director",
        submitted_campus_count: submittedCount,
        missing_directors,
      };
    }

    if (!designation?.id) {
      missing_directors.push({
        campus_id: campusId,
        campus_name: campusNameMap.get(campusId) ?? "Unknown Campus",
      });
      continue;
    }

    const { error } = await supabase.from("evaluation").upsert(
      {
        designation_id: designation.id,
        schedule_id: input.schedule_id,
        evaluation_level: 0,
        evaluator_role: "CAMPUS_DIRECTOR",
        status: "PENDING",
        comment: null,
        created_at: new Date().toISOString(),
      },
      {
        onConflict: "designation_id,schedule_id",
        ignoreDuplicates: false,
      },
    );

    if (error) {
      console.error(
        "lib.ftl.submitScheduleForCampusDirectors evaluation::",
        error,
      );
      return {
        error: error.message ?? "Unable to submit schedule",
        submitted_campus_count: submittedCount,
        missing_directors,
      };
    }

    submittedCount += 1;
  }

  await touchSchedule(input.schedule_id);
  revalidatePath("/ftl");

  return {
    error: null,
    submitted_campus_count: submittedCount,
    missing_directors,
  };
};
