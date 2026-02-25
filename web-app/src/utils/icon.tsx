import {
  Home,
  Building2,
  FileText,
  Users,
  User,
  LucideIcon,
  Landmark,
  Shapes,
  Award,
  CalendarDays,
  NotebookTabs,
} from "lucide-react";

export type IconName =
  | "home"
  | "building-2"
  | "file-text"
  | "users"
  | "user"
  | "landmark"
  | "shapes"
  | "award"
  | "calendar-days"
  | "notebook-tabs";

export const iconMap: Record<string, LucideIcon> = {
  home: Home,
  "building-2": Building2,
  "file-text": FileText,
  users: Users,
  user: User,
  landmark: Landmark,
  shapes: Shapes,
  award: Award,
  "calendar-days": CalendarDays,
  "notebook-tabs": NotebookTabs,
};

export const mapIcon = (name?: IconName) => {
  if (!name) return null;
  return iconMap[name] ?? null;
};
