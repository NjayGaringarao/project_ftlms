"use client";

import { cn } from "@/utils/style";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LogoutButton } from "@/components/auth/logout-button";
import { getNavigationItems } from "@/lib/navigation/items";
import { useEffect, useState } from "react";
import { NavigationItem } from "@/lib/navigation/types";

export function SidebarNav() {
  const pathname = usePathname();
  const [menuItems, setMenuItems] = useState<NavigationItem[]>([]);

  useEffect(() => {
    const loadMenuItems = async () => {
      const items = await getNavigationItems();
      setMenuItems(items);
    };

    loadMenuItems();
  }, []);

  return (
    <nav className="bg-foreground/5 w-48 flex flex-col items-center justify-start">
      <Image
        src="/logo_light.png"
        alt="Logo"
        width={128}
        height={128}
        className="w-38 p-3"
      />
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "w-full px-4 py-2 hover:bg-foreground/5",
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
