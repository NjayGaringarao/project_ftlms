import { NavigationItem } from "@/lib/navigation/types";

export const NAV_ITEMS: NavigationItem[] = [
  {
    label: "Home",
    href: "/home",
    icon: "home",
    requiredRoles: ["ADMIN", "CHAIR", "FACULTY", "DIRECTOR", "EVALUATOR"],
  },
  {
    label: "Campuses",
    href: "/campuses",
    icon: "landmark",
    requiredRoles: ["ADMIN"],
  },
  {
    label: "Departments",
    href: "/departments",
    icon: "shapes",
    requiredRoles: ["ADMIN"],
  },
  {
    label: "Courses",
    href: "/courses",
    icon: "notebook-tabs",
    requiredRoles: ["ADMIN"],
  },
  {
    label: "Academic Ranks",
    href: "/academic-ranks",
    icon: "award",
    requiredRoles: ["ADMIN"],
  },
  {
    label: "Academic Terms",
    href: "/academic-terms",
    icon: "calendar-days",
    requiredRoles: ["ADMIN"],
  },
  {
    label: "FTL",
    href: "/ftl",
    icon: "file-text",
    requiredRoles: ["ADMIN", "CHAIR", "FACULTY", "DIRECTOR", "EVALUATOR"],
  },
  {
    label: "Users",
    href: "/users",
    icon: "users",
    requiredRoles: ["ADMIN"],
  },
  {
    label: "Me",
    href: "/me",
    icon: "user",
    requiredRoles: ["ADMIN", "CHAIR", "FACULTY", "DIRECTOR", "EVALUATOR"],
  },
];
