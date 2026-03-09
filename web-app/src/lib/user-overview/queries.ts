"use server";

import { getCurrentUser } from "@/lib/auth/utils";
import { AcademicRank, Degree, ExtendedDesignation, Identity } from "@/models";
import { createClient } from "@/utils/supabase/server";
import {
  OverviewClassLoad,
  UserOverviewListItem,
  UserOverviewReadModel,
  UserOverviewRpcRow,
} from "./types";

const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseJsonArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  return [];
};

const mapClassRows = (value: unknown): OverviewClassLoad[] => {
  const rows = parseJsonArray<
    Partial<OverviewClassLoad> & {
      lecture_hour?: number | null;
      laboratory_hour?: number | null;
    }
  >(value);

  return rows.map((row) => {
    const lectureUnit = toNumber(row.lecture_unit ?? row.lecture_hour ?? 0);
    const laboratoryUnit = toNumber(
      row.laboratory_unit ?? row.laboratory_hour ?? 0,
    );

    return {
      id: String(row.id ?? ""),
      class_code: String(row.class_code ?? ""),
      course_code: String(row.course_code ?? "Unknown"),
      course_title: String(row.course_title ?? "Untitled Course"),
      lecture_unit: lectureUnit,
      laboratory_unit: laboratoryUnit,
      year_section: String(row.year_section ?? "Not assigned"),
      campus_name: String(row.campus_name ?? "Not assigned"),
      // ATL formula now lives in lib and not in SQL.
      load: lectureUnit + laboratoryUnit * 0.75,
    };
  });
};

const mapRowToOverview = (row: UserOverviewRpcRow): UserOverviewReadModel => {
  const rank: AcademicRank | null = row.academic_rank_id
    ? {
        id: row.academic_rank_id,
        code: row.academic_rank_code ?? "UNKWN",
        title: row.academic_rank_title ?? "",
        description: row.academic_rank_description,
      }
    : null;

  const identity = (row.identity ?? null) as Identity | null;
  const designations = parseJsonArray<Omit<ExtendedDesignation, "user">>(
    row.designations,
  );
  const degrees = parseJsonArray<Degree>(row.degrees);
  const classes = mapClassRows(row.classes);

  const actualTeachingLoad = classes.reduce(
    (sum, classItem) => sum + toNumber(classItem.load),
    0,
  );
  const designationLoad = designations.reduce(
    (sum, designation) => sum + toNumber(designation.load),
    0,
  );

  return {
    id: row.id,
    email: row.email,
    emailConfirmedAt: row.email_confirmed_at,
    accountCreatedAt: row.account_created_at,
    lastSignInAt: row.last_sign_in_at,
    accountType: row.account_type === "Admin" ? "Admin" : "User",
    identity,
    employmentStatus: row.employment_status,
    rank,
    degrees,
    designations,
    term: row.current_term,
    classes,
    actualTeachingLoad,
    designationLoad,
    totalWorkingLoad: actualTeachingLoad + designationLoad,
  };
};

const getUserOverviewRows = async (
  filterUserId?: string,
): Promise<UserOverviewRpcRow[]> => {
  const supabase = await createClient();

  const rpcArgs = filterUserId ? { filter_user_id: filterUserId } : undefined;

  const { data, error } = await supabase.rpc("get_user_overview", rpcArgs);

  if (error) {
    console.error("lib.user-overview.getUserOverviewRows ::", error);
    return [];
  }

  return (data ?? []) as UserOverviewRpcRow[];
};

export const getUserOverviewById = async (
  userId: string,
): Promise<UserOverviewReadModel | null> => {
  const rows = await getUserOverviewRows(userId);
  if (rows.length === 0) return null;
  return mapRowToOverview(rows[0]);
};

export const getCurrentUserOverview =
  async (): Promise<UserOverviewReadModel | null> => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return null;
    return getUserOverviewById(currentUser.id);
  };

export const getUserOverviewList = async (): Promise<
  UserOverviewListItem[]
> => {
  const rows = await getUserOverviewRows();

  return rows.map((row) => {
    const overview = mapRowToOverview(row);
    return {
      id: overview.id,
      email: overview.email,
      identity: overview.identity,
      employmentStatus: overview.employmentStatus,
    };
  });
};
