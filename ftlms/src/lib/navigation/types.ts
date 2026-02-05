import { UserRole } from "@/models/user";

export type NavigationItem = {
  label: string;
  href: string;
  requiredRoles: UserRole[]; // Any role in this list grants access
};
