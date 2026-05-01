import { UserRole } from "@/features/shared/types/models/user";
import { IconName } from "@/utils/icon";

export type NavigationItem = {
  label: string;
  href: string;
  icon?: IconName; // Icon identifier for lucide-react
  allowedRoles: UserRole[]; // Any role in this list grants access
};
