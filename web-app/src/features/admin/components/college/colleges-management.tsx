"use client";

import { useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import { ManagementContainer } from "@/components/layout/management-container";
import { AdminManagementList } from "@/features/admin/components/management/admin-management-list";
import { ManagementPlaceholder } from "@/features/admin/components/management/management-placeholder";
import { useAdminManagementNavigation } from "@/features/admin/hooks/use-admin-management-navigation";
import type { CollegeListItem } from "@/features/admin/lib/colleges";
import type { MajorListItem } from "@/features/admin/lib/majors";
import type { ExtendedProgram } from "@/features/shared/types/models";
import { CollegePanel } from "./college-panel";

type CollegesManagementProps = {
  colleges: CollegeListItem[];
  selectedCollege: CollegeListItem | null;
  programs: ExtendedProgram[];
  majors: MajorListItem[];
  selectedId: string | null;
  isCreating: boolean;
};

export function CollegesManagement({
  colleges,
  selectedCollege,
  programs,
  majors,
  selectedId,
  isCreating,
}: CollegesManagementProps) {
  const nav = useAdminManagementNavigation();
  const [query, setQuery] = useState("");
  const filteredColleges = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return colleges;
    return colleges.filter((college) =>
      [college.code, college.name, college.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [colleges, query]);

  return (
    <ManagementContainer
      list={
        <AdminManagementList
          query={query}
          onQueryChange={setQuery}
          selectedId={selectedId}
          createLabel="Create College"
          searchPlaceholder="Search colleges"
          emptyMessage="No colleges match your search."
          onCreate={nav.openCreate}
          onSelect={nav.openItem}
          items={filteredColleges.map((college) => ({
            id: college.id,
            title: college.code,
            subtitle: [college.name],
            icon: <Building2 className="h-5 w-5" />,
          }))}
        />
      }
      panel={{
        open: isCreating || Boolean(selectedId),
        title: isCreating
          ? "Create College"
          : selectedCollege?.name ?? "College not found",
        description: isCreating
          ? "Add a college."
          : "Edit college details and manage inline programs.",
        content: (
          <CollegePanel
            key={isCreating ? "new" : selectedCollege?.id ?? "missing"}
            college={selectedCollege}
            programs={programs}
            majors={majors}
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
          title="Select a college"
          description="College fields and programs will appear here."
        />
      }
    />
  );
}
