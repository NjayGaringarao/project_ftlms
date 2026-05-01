"use client";

import { useMemo, useState } from "react";
import { User } from "lucide-react";
import { ManagementContainer } from "@/components/layout/management-container";
import { AdminManagementList } from "@/features/admin/components/management/admin-management-list";
import { ManagementPlaceholder } from "@/features/admin/components/management/management-placeholder";
import { useAdminManagementNavigation } from "@/features/admin/hooks/use-admin-management-navigation";
import type { UsersListItem, UserDetail } from "@/features/admin/lib/users/types";
import type { AcademicRank } from "@/features/shared/types/models/academic_rank";
import type { CampusListItem } from "@/features/admin/lib/campuses";
import type { CollegeListItem } from "@/features/admin/lib/colleges";
import { UserCreate } from "./user-create";
import { UserEdit } from "./user-edit";

type UsersManagementProps = {
  users: UsersListItem[];
  selectedUser: UserDetail | null;
  ranks: AcademicRank[];
  campuses: CampusListItem[];
  colleges: CollegeListItem[];
  selectedId: string | null;
  isCreating: boolean;
};

const formatStatus = (status: string | null) => {
  if (!status) return "Unspecified";
  return status
    .split("_")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
};

export function UsersManagement({
  users,
  selectedUser,
  ranks,
  campuses,
  colleges,
  selectedId,
  isCreating,
}: UsersManagementProps) {
  const nav = useAdminManagementNavigation();
  const [query, setQuery] = useState("");

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) =>
      [
        user.identity?.name ?? "",
        user.email ?? "",
        user.campus?.name ?? "",
        user.college?.code ?? "",
        user.employment_status ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query, users]);

  return (
    <ManagementContainer
      list={
        <AdminManagementList
          query={query}
          onQueryChange={setQuery}
          selectedId={selectedId}
          createLabel="Create User"
          searchPlaceholder="Search by name, email, campus, or college"
          emptyMessage="No users match your search."
          onCreate={nav.openCreate}
          onSelect={nav.openItem}
          items={filteredUsers.map((user) => ({
            id: user.id,
            title: user.identity?.name ?? "Unknown User",
            subtitle: [
       
              `${user.campus?.name ?? "No Home"} Campus | ${
                user.college?.code ?? "No Default College"
              } | ${formatStatus(user.employment_status)}`,
            ],
            icon: <User className="h-5 w-5" />,
          }))}
        />
      }
      panel={{
        open: isCreating || Boolean(selectedId),
        title: isCreating
          ? "Create User"
          : selectedUser?.identity?.name ?? "User not found",
        description: isCreating
          ? "Create an account and profile."
          : selectedUser?.email ?? "Edit user profile and access information.",
        content: isCreating ? (
          <UserCreate
            campuses={campuses}
            colleges={colleges}
            onCreated={(id) => {
              nav.refresh();
              nav.replaceWithItem(id);
            }}
            onCancel={nav.closePanel}
          />
        ) : selectedUser ? (
          <UserEdit
            user={selectedUser}
            ranks={ranks}
            campuses={campuses}
            colleges={colleges}
            onClose={nav.closePanel}
          />
        ) : (
          <p className="text-sm text-foreground/70">Select another user from the list.</p>
        ),
        onOpenChange: (open) => {
          if (!open) nav.closePanel();
        },
      }}
      panelPlaceholder={
        <ManagementPlaceholder
          title="Select a user"
          description="User profile, professional details, and security controls will appear here."
        />
      }
    />
  );
}
