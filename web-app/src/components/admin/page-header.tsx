"use client";

import { usePathname } from "next/navigation";
import { iconMap, type IconName } from "@/utils/icon";
import { NAV_ITEMS } from "@/constant/navigation";
import Image from "next/image";
const formatSegmentTitle = (value: string) => {
  return value
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

export function PageHeader() {
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
    <div className="flex flex-row items-center justify-between bg-foreground/80 backdrop-blur-xs z-10 sticky top-0 w-full py-3 px-6 gap-2">
      <div className="flex flex-row gap-2 items-center">
        {Icon && <Icon className="w-8 h-8 text-background" />}
        <p className="text-background text-2xl font-semibold">{title}</p>
      </div>
      <div className="flex flex-row items-center gap-4">
        <p className="text-background/60">Admin Access</p>
        <Image
          src="/prmsu.png"
          alt="Logo"
          width={50}
          height={50}
          className="w-11 h-11"
        />
        <Image
          src="/icto.jpg"
          alt="Logo"
          width={50}
          height={50}
          className="w-9 h-9"
        />
      </div>
    </div>
  );
}
