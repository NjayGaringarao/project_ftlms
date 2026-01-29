// Define the base roles based on your ERD tables
export type UserRole = "ADMIN" | "CHAIR" | "FACULTY" | "EVALUATOR" | "DIRECTOR";

interface NavItem {
  label: string;
  href: string;
  requiredRoles: UserRole[]; // Any role in this list grants access
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "/home",
    requiredRoles: ["ADMIN", "CHAIR", "FACULTY", "DIRECTOR", "EVALUATOR"],
  },
  {
    label: "Campus",
    href: "/campus",
    requiredRoles: ["ADMIN", "CHAIR", "FACULTY", "DIRECTOR", "EVALUATOR"],
  },
  {
    label: "Propose FTL",
    href: "/propose-ftl",
    requiredRoles: ["CHAIR", "ADMIN"],
  },
  {
    label: "Evaluate FTL",
    href: "/evaluate-ftl",
    requiredRoles: ["ADMIN", "CHAIR", "FACULTY", "DIRECTOR", "EVALUATOR"],
  },
  {
    label: "My Faculty Load",
    href: "/my-ftl",
    requiredRoles: ["FACULTY"],
  },
  {
    label: "User Management",
    href: "/user",
    requiredRoles: ["ADMIN"],
  },
];
