import { NavigationItem } from "@/lib/navigation/types";

export const NAV_ITEMS: NavigationItem[] = [
  {
    label: "Home",
    href: "/home",
    icon: "home",
    allowedRoles: [
      "Admin",
      "Program Chairperson",
      "Faculty",
      "Campus Director",
      "College Dean",
      "University President",
      "Director for Instruction",
    ],
  },
  {
    label: "Campuses",
    href: "/campuses",
    icon: "landmark",
    allowedRoles: ["Admin"],
  },
  {
    label: "Colleges",
    href: "/colleges",
    icon: "shapes",
    allowedRoles: ["Admin"],
  },
  {
    label: "Courses",
    href: "/courses",
    icon: "notebook-tabs",
    allowedRoles: ["Admin"],
  },
  {
    label: "Academic Ranks",
    href: "/academic-ranks",
    icon: "award",
    allowedRoles: ["Admin"],
  },
  {
    label: "Academic Terms",
    href: "/academic-terms",
    icon: "calendar-days",
    allowedRoles: ["Admin"],
  },
  {
    label: "FTL",
    href: "/ftl",
    icon: "file-text",
    allowedRoles: [
      "Admin",
      "Program Chairperson",
      "Faculty",
      "Campus Director",
      "College Dean",
      "University President",
      "Director for Instruction",
    ],
  },
  {
    label: "Users",
    href: "/users",
    icon: "users",
    allowedRoles: ["Admin"],
  },
  {
    label: "Me",
    href: "/me",
    icon: "user",
    allowedRoles: [
      "Admin",
      "Program Chairperson",
      "Faculty",
      "Campus Director",
      "College Dean",
      "University President",
      "Director for Instruction",
    ],
  },
];
