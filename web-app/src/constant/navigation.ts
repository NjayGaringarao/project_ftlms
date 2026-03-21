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
    label: "Blocks",
    href: "/blocks",
    icon: "blocks",
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
    label: "Academic Years",
    href: "/academic-years",
    icon: "calendar-days",
    allowedRoles: ["Admin"],
  },
  {
    label: "Faculty Teaching Load",
    href: "/faculty-teaching-load",
    icon: "weight-tilde",
    allowedRoles: ["Admin", "Program Chairperson", "College Dean"],
  },
  {
    label: "Scheduler",
    href: "/scheduler",
    icon: "clock",
    allowedRoles: ["Admin", "Program Chairperson", "College Dean"],
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
