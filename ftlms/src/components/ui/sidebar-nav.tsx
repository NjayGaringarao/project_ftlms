"use client";

import { cn } from "@/utils/style";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { getNavigationItems } from "@/lib/navigation/items";
import { useEffect, useState } from "react";
import { NavigationItem } from "@/lib/navigation/types";
import {
  Home,
  Building2,
  FileText,
  Users,
  User,
  LucideIcon,
  LogOutIcon,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "./button";

// Map icon identifiers to Lucide components
const iconMap: Record<string, LucideIcon> = {
  home: Home,
  "building-2": Building2,
  "file-text": FileText,
  users: Users,
  user: User,
};

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
    <nav className="bg-foreground/5 w-40 flex flex-col items-center justify-start">
      <Image
        src="/logo_light.png"
        alt="Logo"
        width={128}
        height={128}
        className="w-full p-3"
      />
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon ? iconMap[item.icon] : null;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "w-full px-4 py-2 hover:bg-foreground/5 flex items-center gap-3 border-l-4",
              isActive
                ? "font-semibold border-foreground bg-foreground/5"
                : "border-transparent",
            )}
          >
            {Icon && <Icon className="w-5 h-5" />}
            {item.label}
          </Link>
        );
      })}
      <Button
        className="bg-transparent text-foreground text-base py-2 px-4 font-normal hover:bg-foreground/5 w-full rounded-none flex flex-row items-center justify-start"
        onClick={logout}
      >
        <LogOutIcon className="w-5 h-5 ml-3 mr-1" />
        Logout
      </Button>
    </nav>
  );
}
