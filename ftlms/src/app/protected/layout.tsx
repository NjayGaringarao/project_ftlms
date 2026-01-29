"use client";

import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, UserRole } from "@/types/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // This array is dynamically fetched from your database based on the AUTH.USER ID
  const userActiveRoles: UserRole[] = [
    "FACULTY",
    "CHAIR",
    "EVALUATOR",
    "DIRECTOR",
    "ADMIN",
  ];

  // The logic: "Show item if the user has AT LEAST ONE of the required roles"
  const accessibleMenu = NAV_ITEMS.filter((item) =>
    item.requiredRoles.some((role) => userActiveRoles.includes(role)),
  );

  return (
    <div className="h-screen flex flex-row">
      <nav className="bg-foreground/5">
        <Image
          src="/logo_light.png"
          alt="Logo"
          width={50}
          height={50}
          className="w-38 p-3"
        />
        {accessibleMenu.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block px-4 py-2 hover:bg-foreground/5",
                isActive
                  ? "font-semibold border-l-4 border-foreground bg-foreground/5"
                  : "",
              )}
            >
              {item.label}
            </Link>
          );
        })}
        <LogoutButton />
      </nav>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
