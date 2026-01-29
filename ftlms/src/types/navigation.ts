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
    href: "/protected/home",
    requiredRoles: ["ADMIN", "CHAIR", "FACULTY", "DIRECTOR", "EVALUATOR"],
  },
  {
    label: "Campus",
    href: "/protected/campus",
    requiredRoles: ["ADMIN", "CHAIR", "FACULTY", "DIRECTOR", "EVALUATOR"],
  },
  {
    label: "Propose FTL",
    href: "/protected/propose-ftl",
    requiredRoles: ["CHAIR", "ADMIN"],
  },
  {
    label: "Evaluate FTL",
    href: "/protected/evaluate-ftl",
    requiredRoles: ["ADMIN", "CHAIR", "FACULTY", "DIRECTOR", "EVALUATOR"],
  },
  {
    label: "My Faculty Load",
    href: "/protected/my-ftl",
    requiredRoles: ["FACULTY"],
  },
  {
    label: "User Management",
    href: "/protected/user",
    requiredRoles: ["ADMIN"],
  },
];
