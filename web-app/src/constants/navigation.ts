import { NavigationItem } from "@/features/app-shell/lib/navigation/types";
import { UserRole } from "@/features/shared/types/models";

const ALL_ROLES: UserRole[] = [
  "Admin",
  "Program Chairperson",
  "Faculty",
  "Campus Director",
  "College Dean",
  "Vice President for Academic Affairs",
  "Director for Instruction",
];

export const NAV_ITEMS: NavigationItem[] = [
  {
    label: "Home",
    href: "/home",
    icon: "home",
    allowedRoles: ALL_ROLES,
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
    label: "Academic Calendar",
    href: "/academic-calendar",
    icon: "calendar-days",
    allowedRoles: ["Admin"],
  },
  {
    label: "Users",
    href: "/users",
    icon: "users",
    allowedRoles: ["Admin"],
  },
  {
    label: "Blocks",
    href: "/blocks",
    icon: "blocks",
    allowedRoles: ["Program Chairperson", "College Dean"],
  },
  {
    label: "Scheduler",
    href: "/scheduler",
    icon: "clock",
    allowedRoles: ["Program Chairperson", "College Dean"],
  },
  {
    label: "Faculty Teaching Load",
    href: "/faculty-teaching-load",
    icon: "weight-tilde",
    allowedRoles: ["Program Chairperson", "College Dean"],
  },
  {
    label: "FTL Evaluation",
    href: "/ftl-evaluation",
    icon: "book-copy",
    allowedRoles: [
      "Campus Director",
      "Director for Instruction",
      "Vice President for Academic Affairs",
    ],
  },
  {
    label: "Me",
    href: "/me",
    icon: "user",
    allowedRoles: ALL_ROLES,
  },
];
