import { NavigationItem } from "@/lib/navigation/types";

export const NAV_ITEMS: NavigationItem[] = [
  {
    label: "Home",
    href: "/home",
    icon: "home",
    allowedRoles: [
      "ADMIN",
      "PROGRAM_CHAIRPERSON",
      "FACULTY",
      "CAMPUS_DIRECTOR",
      "HIGHER-UPS",
    ],
  },
  {
    label: "Campuses",
    href: "/campuses",
    icon: "landmark",
    allowedRoles: ["ADMIN"],
  },
  {
    label: "Departments",
    href: "/departments",
    icon: "shapes",
    allowedRoles: ["ADMIN"],
  },
  {
    label: "Courses",
    href: "/courses",
    icon: "notebook-tabs",
    allowedRoles: ["ADMIN"],
  },
  {
    label: "Curriculums",
    href: "/curriculums",
    icon: "book-copy",
    allowedRoles: ["ADMIN"],
  },
  {
    label: "Academic Ranks",
    href: "/academic-ranks",
    icon: "award",
    allowedRoles: ["ADMIN"],
  },
  {
    label: "Academic Terms",
    href: "/academic-terms",
    icon: "calendar-days",
    allowedRoles: ["ADMIN"],
  },
  {
    label: "FTL",
    href: "/ftl",
    icon: "file-text",
    allowedRoles: [
      "ADMIN",
      "PROGRAM_CHAIRPERSON",
      "FACULTY",
      "CAMPUS_DIRECTOR",
      "HIGHER-UPS",
    ],
  },
  {
    label: "Users",
    href: "/users",
    icon: "users",
    allowedRoles: ["ADMIN"],
  },
  {
    label: "Me",
    href: "/me",
    icon: "user",
    allowedRoles: [
      "ADMIN",
      "PROGRAM_CHAIRPERSON",
      "FACULTY",
      "CAMPUS_DIRECTOR",
      "HIGHER-UPS",
    ],
  },
];
