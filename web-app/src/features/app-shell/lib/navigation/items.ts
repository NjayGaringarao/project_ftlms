"use server";

import { NavigationItem } from "./types";
import { NAV_ITEMS } from "@/constants/navigation";
import { getUserRole } from "@/features/auth/lib/utils";

export const getNavigationItems = async (): Promise<NavigationItem[]> => {
  const userActiveRoles = await getUserRole();

  return NAV_ITEMS.filter((item) =>
    item.allowedRoles.some((role) => userActiveRoles.includes(role)),
  );
};
