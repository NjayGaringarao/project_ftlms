"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/constant/navigation";
import { iconMap, type IconName } from "@/utils/icon";

type PageHeaderProps = {
  title?: string;
  iconName?: IconName;
  accessLabel?: string;
};

const formatSegmentTitle = (value: string) => {
  return value
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

export function PageHeader({
  title,
  iconName,
  accessLabel = "Admin Access",
}: PageHeaderProps) {
  const pathname = usePathname();
  const activeItem = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );

  const resolvedIconName =
    iconName ?? (activeItem?.icon as IconName | undefined);
  const Icon = resolvedIconName ? iconMap[resolvedIconName] : null;

  const fallbackTitle =
    pathname === "/"
      ? "Home"
      : formatSegmentTitle(
          pathname.split("/").filter(Boolean).at(-1) ?? "Page",
        );

  const resolvedTitle = title ?? activeItem?.label ?? fallbackTitle;

  return (
    <div className="flex flex-row items-center justify-between bg-foreground/80 backdrop-blur-xs z-10 sticky top-0 w-full py-3 px-6 gap-2">
      <div className="flex flex-row gap-2 items-center">
        {Icon && <Icon className="w-8 h-8 text-background" />}
        <p className="text-background text-2xl font-semibold">
          {resolvedTitle}
        </p>
      </div>
      <div className="flex flex-row items-center gap-4">
        <p className="text-background/60">{accessLabel}</p>
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
