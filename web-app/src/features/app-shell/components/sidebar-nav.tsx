"use client";

import { cn } from "@/utils/style";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { getNavigationItems } from "@/features/app-shell/lib/navigation/items";
import { useEffect, useState } from "react";
import { NavigationItem } from "@/features/app-shell/lib/navigation/types";
import { LogOutIcon } from "lucide-react";
import { mapIcon } from "@/utils/icon";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";

export function SidebarNav() {
  const pathname = usePathname();
  const [menuItems, setMenuItems] = useState<NavigationItem[]>([]);
  const [isConfirmLogoutOpen, setIsConfirmLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogoutSubmit = () => {
    setIsLoggingOut(true);
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
        src="/prmsu.png"
        alt="Logo"
        width={128}
        height={128}
        className="w-full p-4 hidden md:block"
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
                "w-full px-4 py-2 hover:bg-foreground/5 flex items-center gap-3 text-sm",
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
          type="button"
          disabled={isLoggingOut}
          onClick={() => setIsConfirmLogoutOpen(true)}
          className={cn(
            "w-full px-4 py-2 hover:bg-foreground/5 flex items-center gap-3 text-sm",
            "border-transparent border-b-4 justify-center md:border-l-4 md:border-b-0 md:justify-start",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        >
          <LogOutIcon className="w-5 h-5" />
          <span className="truncate hidden md:block">
            {isLoggingOut ? "Logging out..." : "Logout"}
          </span>
        </button>
      </div>

      <AppDialog
        open={isConfirmLogoutOpen}
        onOpenChange={setIsConfirmLogoutOpen}
        variant="floating-small"
        title="Confirm Logout"
        description="You can login anytime but unsaved changes will be lost."
        contentClassName="p-4"
      >
        <form
          action="/auth/logout"
          method="post"
          onSubmit={handleConfirmLogoutSubmit}
          className="flex justify-end gap-2"
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsConfirmLogoutOpen(false)}
            disabled={isLoggingOut}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoggingOut}>
            Confirm
          </Button>
        </form>
      </AppDialog>
    </nav>
  );
}
