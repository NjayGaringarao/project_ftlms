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
  BookCopy,
  WeightTilde,
  Clock,
  Blocks as Sections,
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
  | "notebook-tabs"
  | "book-copy"
  | "weight-tilde"
  | "clock"
  | "sections";

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
  "book-copy": BookCopy,
  "weight-tilde": WeightTilde,
  clock: Clock,
  sections: Sections,
};

export const mapIcon = (name?: IconName) => {
  if (!name) return null;
  return iconMap[name] ?? null;
};
