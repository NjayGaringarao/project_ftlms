import { NavigationItem } from "@/lib/navigation/types";

export const NAV_ITEMS: NavigationItem[] = [
  {
    label: "Home",
    href: "/home",
    icon: "home",
    requiredRoles: ["ADMIN", "CHAIR", "FACULTY", "DIRECTOR", "EVALUATOR"],
  },
  {
    label: "University",
    href: "/university",
    icon: "building-2",
    requiredRoles: ["ADMIN", "CHAIR", "FACULTY", "DIRECTOR", "EVALUATOR"],
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
