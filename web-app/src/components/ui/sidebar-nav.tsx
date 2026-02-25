"use client";

import { cn } from "@/utils/style";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { getNavigationItems } from "@/lib/navigation/items";
import { useEffect, useState } from "react";
import { NavigationItem } from "@/lib/navigation/types";
import { LogOutIcon } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { mapIcon } from "@/utils/icon";

export function SidebarNav() {
  const pathname = usePathname();
  const [menuItems, setMenuItems] = useState<NavigationItem[]>([]);
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  useEffect(() => {
    const loadMenuItems = async () => {
      const items = await getNavigationItems();
      setMenuItems(items);
    };

    loadMenuItems();
  }, []);

  return (
    <nav
      className={cn(
        "bg-foreground/5 w-full flex",
        "flex-row items-center justify-around",
        "md:w-52 md:flex-col md:justify-start md:items-start",
        "overflow-hidden",
      )}
    >
      <Image
        src="/logo_light.png"
        alt="Logo"
        width={128}
        height={128}
        className="w-full p-3 hidden md:block"
      />

      <div
        className={cn(
          "flex flex-row items-center justify-around",
          "md:w-52 md:flex-col md:justify-start md:items-start",
          "overflow-y-auto",
        )}
      >
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = mapIcon(item.icon);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "w-full px-4 py-2 hover:bg-foreground/5 flex items-center gap-3",
                isActive
                  ? "font-semibold border-foreground bg-foreground/5"
                  : "border-transparent",
                "border-b-4 justify-center md:border-l-4 md:border-b-0 md:justify-start",
              )}
            >
              {Icon && <Icon className="w-5 h-5" />}

              <span className="truncate hidden md:block">{item.label}</span>
            </Link>
          );
        })}
        <button
          className="w-full text-foreground text-base py-2 px-4 font-normal hover:bg-foreground/5 rounded-none flex flex-row items-center justify-start"
          onClick={logout}
        >
          <LogOutIcon className="w-5 h-5 ml-1 mr-1" />
          <span className="truncate hidden md:block">Logout</span>
        </button>
      </div>
    </nav>
  );
}
