"use server";

import { getCurrentUser } from "@/lib/auth/utils";
import { AcademicRank, Degree, ExtendedDesignation, Identity } from "@/models";
import { createClient } from "@/utils/supabase/server";
import {
  OverviewClassLoad,
  UserDataOptions,
  UserDataReadModel,
  UserDataRpcRow,
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
      load: lectureUnit + laboratoryUnit * 0.75,
    };
  });
};

const mapRowToUserData = (row: UserDataRpcRow): UserDataReadModel => {
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

  const actualTeachingLoad =
    row.actual_teaching_load === null || row.actual_teaching_load === undefined
      ? classes.reduce((sum, classItem) => sum + toNumber(classItem.load), 0)
      : toNumber(row.actual_teaching_load);

  const designationLoad =
    row.designation_load === null || row.designation_load === undefined
      ? designations.reduce(
          (sum, designation) => sum + toNumber(designation.load),
          0,
        )
      : toNumber(row.designation_load);

  const totalWorkingLoad =
    row.total_working_load === null || row.total_working_load === undefined
      ? actualTeachingLoad + designationLoad
      : toNumber(row.total_working_load);

  return {
    id: row.id,
    email: row.email,
    emailConfirmedAt: row.email_confirmed_at,
    accountCreatedAt: row.account_created_at,
    lastSignInAt: row.last_sign_in_at,
    accountType: row.account_type === "Admin" ? "Admin" : "User",
    identity,
    employmentStatus: row.employment_status,
    campus_id: row.campus_id ?? null,
    college_id: row.college_id ?? null,
    campus: row.campus ?? null,
    college: row.college ?? null,
    rank,
    degrees,
    designations,
    term: row.current_term,
    classes,
    actualTeachingLoad,
    designationLoad,
    totalWorkingLoad,
  };
};

const buildRpcArgs = (
  filterUserId?: string,
  options?: UserDataOptions,
): Record<string, unknown> => {
  const args: Record<string, unknown> = {};

  if (filterUserId) {
    args.filter_user_id = filterUserId;
  }

  if (options?.academicTermId !== undefined) {
    args.academic_term_id = options.academicTermId;
  }

  if (options?.includeDegrees) {
    args.include_degrees = true;
  }

  if (options?.includeDesignations) {
    args.include_designations = true;
  }

  if (options?.includeClasses) {
    args.include_classes = true;
  }

  if (options?.includeLoads) {
    args.include_loads = true;
  }

  return args;
};

export const getUserDataList = async (
  options?: UserDataOptions,
): Promise<UserDataReadModel[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "get_user_data",
    buildRpcArgs(undefined, options),
  );

  if (error) {
    console.error("lib.user-data.getUserDataList ::", error);
    return [];
  }

  return (data ?? []).map((row: UserDataRpcRow) => mapRowToUserData(row));
};

export const getUserDataById = async (
  userId: string,
  options?: UserDataOptions,
): Promise<UserDataReadModel | null> => {
  if (!userId?.trim()) return null;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "get_user_data",
    buildRpcArgs(userId, options),
  );

  if (error) {
    console.error("lib.user-data.getUserDataById ::", error);
    return null;
  }

  const rows = (data ?? []) as UserDataRpcRow[];
  if (rows.length === 0) return null;
  return mapRowToUserData(rows[0]);
};

export const getCurrentUserData = async (
  options?: UserDataOptions,
): Promise<UserDataReadModel | null> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;
  return getUserDataById(currentUser.id, options);
};
