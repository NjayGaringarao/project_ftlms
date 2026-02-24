"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type UseListStateOptions<T> = {
  items: T[];
  match: RegExp;
  filter: (items: T[], query: string) => T[];
};

type UseListStateResult<T> = {
  query: string;
  setQuery: (value: string) => void;
  selectedId: string | null;
  filteredItems: T[];
};

export const useListState = <T>({
  items,
  match,
  filter,
}: UseListStateOptions<T>): UseListStateResult<T> => {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const selectedId = useMemo(() => {
    const matchResult = pathname.match(match);
    return matchResult ? matchResult[1] : null;
  }, [pathname, match]);

  const filteredItems = useMemo(() => {
    return filter(items, query);
  }, [items, query, filter]);

  return { query, setQuery, selectedId, filteredItems };
};
