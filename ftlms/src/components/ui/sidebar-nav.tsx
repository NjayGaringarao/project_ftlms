"use client";

import { cn } from "@/lib/utils";
import { NAV_ITEMS, UserRole } from "@/types/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LogoutButton } from "@/components/auth/logout-button";

interface SidebarNavProps {
  userActiveRoles: UserRole[];
}

export function SidebarNav({ userActiveRoles }: SidebarNavProps) {
  const pathname = usePathname();

  // The logic: "Show item if the user has AT LEAST ONE of the required roles"
  const accessibleMenu = NAV_ITEMS.filter((item) =>
    item.requiredRoles.some((role) => userActiveRoles.includes(role)),
  );

  return (
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
  );
}
