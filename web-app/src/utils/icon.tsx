import {
  Home,
  Building2,
  FileText,
  Users,
  User,
  LucideIcon,
  Landmark,
} from "lucide-react";

export type IconName =
  | "home"
  | "building-2"
  | "file-text"
  | "users"
  | "user"
  | "landmark";

export const iconMap: Record<string, LucideIcon> = {
  home: Home,
  "building-2": Building2,
  "file-text": FileText,
  users: Users,
  user: User,
  landmark: Landmark,
};

export const mapIcon = (name?: IconName) => {
  if (!name) return null;
  return iconMap[name] ?? null;
};
