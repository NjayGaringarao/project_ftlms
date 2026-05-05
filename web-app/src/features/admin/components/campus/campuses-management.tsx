"use client";

import { useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import { ManagementContainer } from "@/components/layout/management-container";
import { AdminManagementList } from "@/features/admin/components/management/admin-management-list";
import { ManagementPlaceholder } from "@/features/admin/components/management/management-placeholder";
import { useAdminManagementNavigation } from "@/features/admin/hooks/use-admin-management-navigation";
import type { CampusListItem } from "@/features/admin/lib/campuses";
import type { MajorOfferingListItem } from "@/features/admin/lib/major-offerings";
import type { MajorListItem } from "@/features/admin/lib/majors";
import type { ProgramOfferingListItem } from "@/features/admin/lib/program-offerings";
import type { ExtendedRoom } from "@/features/shared/types/models/room";
import type { ExtendedProgram } from "@/features/shared/types/models";
import { CampusPanel } from "./campus-panel";

type CampusesManagementProps = {
  campuses: CampusListItem[];
  selectedCampus: CampusListItem | null;
  rooms: ExtendedRoom[];
  offerings: ProgramOfferingListItem[];
  programs: ExtendedProgram[];
  majors: MajorListItem[];
  majorOfferings: MajorOfferingListItem[];
  selectedId: string | null;
  isCreating: boolean;
};

export function CampusesManagement({
  campuses,
  selectedCampus,
  rooms,
  offerings,
  programs,
  majors,
  majorOfferings,
  selectedId,
  isCreating,
}: CampusesManagementProps) {
  const nav = useAdminManagementNavigation();
  const [query, setQuery] = useState("");
  const filteredCampuses = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return campuses;
    return campuses.filter((campus) =>
      [campus.code, campus.name, campus.address ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [campuses, query]);

  return (
    <ManagementContainer
      list={
        <AdminManagementList
          query={query}
          onQueryChange={setQuery}
          selectedId={selectedId}
          createLabel="Create Campus"
          searchPlaceholder="Search campuses"
          emptyMessage="No campuses match your search."
          onCreate={nav.openCreate}
          onSelect={nav.openItem}
          items={filteredCampuses.map((campus) => ({
            id: campus.id,
            title: campus.name,
            subtitle: [campus.address || "No address"],
            icon: <Building2 className="h-5 w-5" />,
          }))}
        />
      }
      panel={{
        open: isCreating || Boolean(selectedId),
        title: isCreating
          ? "Create Campus"
          : selectedCampus?.name.concat(" Campus") ?? "Campus not found",
      
        content: (
          <CampusPanel
            key={
              isCreating ? "create" : selectedCampus?.id ?? selectedId ?? "empty"
            }
            campus={selectedCampus}
            rooms={rooms}
            offerings={offerings}
            programs={programs}
            majors={majors}
            majorOfferings={majorOfferings}
            isCreating={isCreating}
            onClose={nav.closePanel}
            onCreated={nav.replaceWithItem}
            onRefresh={nav.refresh}
          />
        ),
        onOpenChange: (open) => {
          if (!open) nav.closePanel();
        },
      }}
      panelPlaceholder={
        <ManagementPlaceholder
          title="Select a campus"
          description="Campus fields, rooms, and program offerings will appear here."
        />
      }
    />
  );
}
