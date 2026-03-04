"use server";

import { createClient } from "@/utils/supabase/server";
import { ensureProgramChair } from "./auth";
import { asNumber, asObject, asString, RowObject } from "./shared";
import { FTLBootstrapData, FTLFaculty, FTLRoom } from "../types";

export const getProgramChairBootstrapData =
  async (): Promise<FTLBootstrapData> => {
    await ensureProgramChair();
    const supabase = await createClient();

    const [termsResult, campusesResult] = await Promise.all([
      supabase
        .from("academic_term")
        .select(
          "id, code, academic_year_start, academic_year_end, term_order, type, start, end",
        )
        .order("academic_year_start", { ascending: false })
        .order("academic_year_end", { ascending: false })
        .order("term_order", { ascending: true }),
      supabase
        .from("campus")
        .select("id, name")
        .order("name", { ascending: true }),
    ]);

    if (termsResult.error) {
      console.error(
        "lib.ftl.getProgramChairBootstrapData terms::",
        termsResult.error,
      );
    }

    if (campusesResult.error) {
      console.error(
        "lib.ftl.getProgramChairBootstrapData campuses::",
        campusesResult.error,
      );
    }

    return {
      terms: termsResult.data ?? [],
      campuses: campusesResult.data ?? [],
    };
  };

export const getFacultyList = async (): Promise<FTLFaculty[]> => {
  await ensureProgramChair();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user")
    .select(
      `
      id,
      employment_status,
      identity(first_name, middle_name, last_name, extension),
      designation(load)
    `,
    )
    .order("id", { ascending: true });

  if (error) {
    console.error("lib.ftl.getFacultyList ::", error);
    return [];
  }

  return (data ?? []).map((raw) => {
    const row = raw as RowObject;
    const identity = asObject(row.identity);
    const designations = (
      (row.designation as RowObject[] | undefined) ?? []
    ).map((item) => asNumber(item.load) ?? 0);

    return {
      id: asString(row.id) ?? "",
      first_name: asString(identity?.first_name) ?? "",
      middle_name: asString(identity?.middle_name),
      last_name: asString(identity?.last_name) ?? "",
      extension: asString(identity?.extension),
      employment_status: asString(row.employment_status) ?? "UNKNOWN",
      total_designation_load: designations.reduce(
        (sum, value) => sum + value,
        0,
      ),
    };
  });
};

export const getRoomsByCampus = async (
  campusId: string,
): Promise<FTLRoom[]> => {
  await ensureProgramChair();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("room")
    .select("id, campus_id, code, name")
    .eq("campus_id", campusId)
    .order("code", { ascending: true });

  if (error) {
    console.error("lib.ftl.getRoomsByCampus ::", error);
    return [];
  }

  return (data ?? []) as FTLRoom[];
};
