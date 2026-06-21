"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import ListItemSmall from "@/components/ui/list-item-small";
import type { CampusCollegeLoadDetail } from "@/features/campus-college-load/lib/queries";

const RevisionSelector = ({ detail }: { detail: CampusCollegeLoadDetail }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const navigateWithQuery = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      const queryString = next.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const openRevision = (revisionId: string | null) =>
    navigateWithQuery((next) => {
      if (revisionId) {
        next.set("revision_id", revisionId);
      } else {
        next.delete("revision_id");
      }
    });

  if (detail.revisions.length <= 1) return null;

  const isLatestRevisionViewed =
    !detail.viewed_revision ||
    detail.viewed_revision.id === detail.latest_revision?.id;

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Revision {detail.viewed_revision?.revision_number ?? 0}
        {isLatestRevisionViewed ? " (Latest)" : ""}
      </Button>

      <AppDialog
        open={open}
        onOpenChange={setOpen}
        title="Select Revision"
        description="View a previously frozen snapshot."
        variant="floating-medium"
        contentClassName="flex max-h-[85vh] p-4 flex-col overflow-hidden"
      >
        <div className="grid flex-1 grid-cols-1 gap-2 overflow-y-auto">
          {detail.revisions.map((revision) => (
            <ListItemSmall
              key={revision.id}
              title={`Revision ${revision.revision_number}`}
              subtitle={[
                revision.submitted_by_name ?? "Unknown submitter",
                revision.id === detail.latest_revision?.id ? "Latest" : "",
              ].filter(Boolean)}
              isSelected={revision.id === detail.viewed_revision?.id}
              onClick={() => {
                openRevision(
                  revision.id === detail.latest_revision?.id ? null : revision.id,
                );
                setOpen(false);
              }}
            />
          ))}
        </div>
      </AppDialog>
    </>
  );
};

export default RevisionSelector;
