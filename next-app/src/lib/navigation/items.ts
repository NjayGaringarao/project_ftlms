"use server";

import { UserRole } from "@/models/user";
import { NavigationItem } from "./types";
import { NAV_ITEMS } from "@/constant/navigation";

export const getNavigationItems = async (): Promise<NavigationItem[]> => {
  // This array should be dynamically fetched from the database based on the AUTH.USER ID
  const userActiveRoles: UserRole[] = [
    "FACULTY",
    "CHAIR",
    "EVALUATOR",
    "DIRECTOR",
    "ADMIN",
  ];

  return NAV_ITEMS.filter((item) =>
    item.requiredRoles.some((role) => userActiveRoles.includes(role)),
  );
};
