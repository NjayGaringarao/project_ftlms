import { UserRole } from "@/models/user";

export type NavigationItem = {
  label: string;
  href: string;
  icon?: string; // Icon identifier for lucide-react
  requiredRoles: UserRole[]; // Any role in this list grants access
};
