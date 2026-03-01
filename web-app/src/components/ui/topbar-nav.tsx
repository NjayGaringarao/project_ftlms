"use client";

import { usePathname } from "next/navigation";
import { iconMap, type IconName } from "@/utils/icon";
import { NAV_ITEMS } from "@/constant/navigation";

const formatSegmentTitle = (value: string) => {
  return value
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

export function TopBarNav() {
  const pathname = usePathname();
  const activeItem = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );
  const iconName = activeItem?.icon as IconName | undefined;
  const Icon = iconName ? iconMap[iconName] : null;
  const fallbackTitle =
    pathname === "/"
      ? "Home"
      : formatSegmentTitle(
          pathname.split("/").filter(Boolean).at(-1) ?? "Page",
        );
  const title = activeItem?.label ?? fallbackTitle;

  return (
    <div className="flex flex-row items-center justify-between bg-foreground/80 backdrop-blur-xs z-10 sticky top-0 w-full py-4 px-6 gap-2">
      <div className="flex flex-row gap-2 items-center">
        {Icon && <Icon className="w-8 h-8 text-background" />}
        <p className="text-background text-2xl font-semibold">{title}</p>
      </div>
    </div>
  );
}
