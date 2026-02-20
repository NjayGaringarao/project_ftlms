"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/utils/style";
import { mapIcon, IconName } from "@/utils/icon";

interface TopBarNavItem {
  label: string;
  href: string;
}

interface TopBarNavProps {
  title: string;
  items: TopBarNavItem[];
  icon?: IconName; // Icon identifier for lucide-react
}

export function TopBarNav({ title, items, icon }: TopBarNavProps) {
  const Icon = mapIcon(icon);
  const pathname = usePathname();

  return (
    <div className="flex flex-row items-center justify-between bg-foreground/80 backdrop-blur-xs z-10 sticky top-0 w-full py-4 px-6 gap-2">
      <div className="flex flex-row gap-2 items-center">
        {Icon && <Icon className="w-8 h-8 text-background" />}
        <p className="text-background text-2xl font-semibold">{title}</p>
      </div>

      <div className="flex flex-row gap-1 h-12 items-center overflow-x-auto overflow-y-hidden">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-4 py-2 rounded hover:bg-background/10 text-background transition-colors border-b-2",
                isActive
                  ? "font-semibold border-background"
                  : "border-transparent",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
