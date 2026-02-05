import {
  Home,
  Building2,
  FileText,
  Users,
  User,
  LucideIcon,
} from "lucide-react";

export type IconName = "home" | "building-2" | "file-text" | "users" | "user";

export const iconMap: Record<string, LucideIcon> = {
  home: Home,
  "building-2": Building2,
  "file-text": FileText,
  users: Users,
  user: User,
};

export const mapIcon = (name?: IconName) => {
  if (!name) return null;
  return iconMap[name] ?? null;
};
