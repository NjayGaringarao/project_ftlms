"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookCopy, ClipboardCheck } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { ManagementContainer } from "@/components/layout/management-container";
import { AdminManagementList } from "@/features/admin/components/management/admin-management-list";
import { ManagementPlaceholder } from "@/features/admin/components/management/management-placeholder";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import type {
  CampusCollegeLoadDetail,
  CampusCollegeLoadEvaluatorBucket,
  CampusCollegeLoadListItem,
} from "@/features/campus-college-load/lib/queries";
import {
  ActionContent,
  CampusCollegeLoadDetailPanel,
  statusClass,
  stepLabel,
} from "@/features/campus-college-load/components/campus-college-load-snapshot-summary";

const getItemKey = (item: CampusCollegeLoadListItem) =>
  item.load?.id ?? `${item.campus_id}:${item.college_id}`;

const getItemTitle = (item: CampusCollegeLoadListItem) =>
  `${item.college_code ?? "Department"} - ${item.campus_name ?? "Campus"}`;

type BucketFilter = CampusCollegeLoadEvaluatorBucket;

const bucketOptions: Array<{ label: string; value: BucketFilter }> = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Returned", value: "RETURNED" },
];

const DetailPanel = ({
  detail,
}: {
  detail: CampusCollegeLoadDetail | null;
}) => {
  const [actionOpen, setActionOpen] = useState(false);

  if (!detail) {
    return (
      <div className="flex min-h-64 items-center justify-center p-6 text-sm text-foreground/70">
        Select a campus-college load to begin.
      </div>
    );
  }

  const hasModalAction = Boolean(detail.can_evaluate_step);

  return (
    <>
      <CampusCollegeLoadDetailPanel
        detail={detail}
        actionSlot={
          hasModalAction ? (
            <Button type="button" size="sm" onClick={() => setActionOpen(true)}>
              <ClipboardCheck className="h-4 w-4" />
              Evaluate
            </Button>
          ) : null
        }
      />

      {hasModalAction ? (
        <AppDialog
          open={actionOpen}
          onOpenChange={setActionOpen}
          title="Evaluate"
          variant="floating-medium"
          contentClassName="p-4"
        >
          <ActionContent detail={detail} />
        </AppDialog>
      ) : null}
    </>
  );
};

const CampusCollegeLoadEvaluator = ({
  items,
  detail,
  selectedId,
}: {
  items: CampusCollegeLoadListItem[];
  detail: CampusCollegeLoadDetail | null;
  selectedId: string | null;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [bucket, setBucket] = useState<BucketFilter>("PENDING");

  const navigateWithQuery = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      const queryString = next.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const openItem = (item: CampusCollegeLoadListItem) =>
    navigateWithQuery((next) => {
      if (item.load) {
        next.set("id", item.load.id);
      }
      next.delete("campus_id");
      next.delete("college_id");
      next.delete("revision_id");
    });

  const closePanel = () =>
    navigateWithQuery((next) => {
      next.delete("id");
      next.delete("revision_id");
    });

  const bucketedItems = useMemo(
    () => items.filter((item) => item.evaluator_bucket === bucket),
    [items, bucket],
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bucketedItems;

    return bucketedItems.filter((item) =>
      [
        item.campus_code,
        item.campus_name,
        item.college_code,
        item.college_name,
        item.load?.status ?? "DRAFT",
        stepLabel[item.load?.current_step ?? "PROGRAM_CHAIR"],
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [bucketedItems, query]);

  const selectedItem = items.find((item) => getItemKey(item) === selectedId) ?? null;

  return (
    <ManagementContainer
      list={
        <AdminManagementList
          query={query}
          onQueryChange={setQuery}
          filters={
            <FilterChipGroup
              value={bucket}
              onChange={setBucket}
              options={bucketOptions}
            />
          }
          selectedId={selectedId}
          searchPlaceholder="Search campus-college loads"
          emptyMessage="No campus-college loads match your search."
          onSelect={(id) => {
            const item = items.find((entry) => getItemKey(entry) === id);
            if (item) openItem(item);
          }}
          items={filteredItems.map((item) => {
            const status = item.load?.status ?? "DRAFT";
            return {
              id: getItemKey(item),
              title: getItemTitle(item),
              subtitle: [],
              icon: <BookCopy className="h-5 w-5" />,
              annotations: (
                <span
                  className={`rounded border px-2 py-1 text-xs ${statusClass[status]}`}
                >
                  {status}
                </span>
              ),
            };
          })}
        />
      }
      panel={{
        open: Boolean(detail),
        title: selectedItem ? `${getItemTitle(selectedItem)} College Load` : "Campus College Load",
        content: <DetailPanel detail={detail} />,
        onOpenChange: (open) => {
          if (!open) closePanel();
        },
      }}
      panelPlaceholder={
        <ManagementPlaceholder
          title="Select a campus-college load"
          description="Snapshot details, revision history, and approval actions will appear here."
        />
      }
    />
  );
};

export default CampusCollegeLoadEvaluator;
