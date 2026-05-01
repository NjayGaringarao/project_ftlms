"use client";

import { usePathname, useRouter } from "next/navigation";

export function useAdminManagementNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  return {
    openCreate: () => router.push(`${pathname}?new=1`),
    openItem: (id: string) => router.push(`${pathname}?id=${id}`),
    closePanel: () => router.push(pathname),
    replaceWithItem: (id: string) => router.replace(`${pathname}?id=${id}`),
    refresh: () => router.refresh(),
  };
}
