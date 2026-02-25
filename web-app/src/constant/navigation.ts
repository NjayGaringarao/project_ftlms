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
    label: "Programs",
    href: "/programs",
    icon: "building-2",
    requiredRoles: ["ADMIN"],
  },
  {
    label: "Program Offerings",
    href: "/program-offerings",
    icon: "shapes",
    requiredRoles: ["ADMIN"],
  },
  {
    label: "Majors",
    href: "/majors",
    icon: "award",
    requiredRoles: ["ADMIN"],
  },
  {
    label: "Major Offerings",
    href: "/major-offerings",
    icon: "file-text",
    requiredRoles: ["ADMIN"],
  },
  {
    label: "Course Offerings",
    href: "/course-offerings",
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
