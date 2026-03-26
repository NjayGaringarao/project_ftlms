"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ProposalStatusFilter } from "@/lib/proposal/types";

type ProposalListBaseItem = {
  id: string;
  name: string;
  proposal_filter_status: ProposalStatusFilter;
};

type UseProposalListControllerParams<TItem extends ProposalListBaseItem> = {
  items: TItem[];
  defaultStatus: ProposalStatusFilter;
  isSelectable: (item: TItem) => boolean;
  longPressDelayMs?: number;
};

export const useProposalListController = <TItem extends ProposalListBaseItem>({
  items,
  defaultStatus,
  isSelectable,
  longPressDelayMs = 450,
}: UseProposalListControllerParams<TItem>) => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProposalStatusFilter>(defaultStatus);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressedClickIdRef = useRef<string | null>(null);

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const searchMatchedItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, query]);

  const statusCounts = useMemo(
    () =>
      searchMatchedItems.reduce(
        (acc, item) => {
          acc[item.proposal_filter_status] += 1;
          return acc;
        },
        {
          PENDING: 0,
          APPROVED: 0,
          REJECTED: 0,
          INVALIDATED: 0,
          NO_PROPOSAL: 0,
        } satisfies Record<ProposalStatusFilter, number>,
      ),
    [searchMatchedItems],
  );

  const filteredItems = useMemo(
    () =>
      searchMatchedItems.filter(
        (item) => item.proposal_filter_status === statusFilter,
      ),
    [searchMatchedItems, statusFilter],
  );

  const selectableFilteredIds = useMemo(
    () => filteredItems.filter(isSelectable).map((item) => item.id),
    [filteredItems, isSelectable],
  );

  const clearLongPressTimer = () => {
    if (!longPressTimerRef.current) return;
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  useEffect(
    () => () => {
      clearLongPressTimer();
    },
    [],
  );

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds([]);
    suppressedClickIdRef.current = null;
  };

  const toggleSelected = (itemId: string) => {
    setSelectedIds((previous) => {
      const next = previous.includes(itemId)
        ? previous.filter((id) => id !== itemId)
        : [...previous, itemId];

      if (next.length === 0) {
        setIsSelectionMode(false);
      }

      return next;
    });
  };

  const onItemClick = (item: TItem, onNavigate: () => void) => {
    if (suppressedClickIdRef.current === item.id) {
      suppressedClickIdRef.current = null;
      return;
    }
    if (suppressedClickIdRef.current !== null) {
      suppressedClickIdRef.current = null;
    }

    if (isSelectionMode) {
      if (!isSelectable(item)) return;
      toggleSelected(item.id);
      return;
    }

    onNavigate();
  };

  const onItemPointerDown = (item: TItem) => {
    if (isSelectionMode || !isSelectable(item)) return;
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      suppressedClickIdRef.current = item.id;
      setIsSelectionMode(true);
      setSelectedIds([item.id]);
      longPressTimerRef.current = null;
    }, longPressDelayMs);
  };

  const selectAllFiltered = () => {
    setSelectedIds(selectableFilteredIds);
  };

  return {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    isSelectionMode,
    selectedIds,
    selectedIdSet,
    searchMatchedItems,
    statusCounts,
    filteredItems,
    selectableFilteredIds,
    clearLongPressTimer,
    exitSelectionMode,
    onItemClick,
    onItemPointerDown,
    selectAllFiltered,
  };
};
