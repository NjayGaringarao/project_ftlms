"use client";

import { useMemo, useState } from "react";
import { Funnel, User } from "lucide-react";
import { Select } from "@/components/ui/select";
import { ManagementContainer } from "@/components/layout/management-container";
import { AdminManagementList } from "@/features/admin/components/management/admin-management-list";
import { ManagementPlaceholder } from "@/features/admin/components/management/management-placeholder";
import { useAdminManagementNavigation } from "@/features/admin/hooks/use-admin-management-navigation";
import type { UsersListItem, UserDetail } from "@/features/admin/lib/users/types";
import type { AcademicRank } from "@/features/shared/types/models/academic_rank";
import type { CampusListItem } from "@/features/admin/lib/campuses";
import type { CollegeListItem } from "@/features/admin/lib/colleges";
import type { ProgramCampusOffering } from "@/features/admin/lib/programs";
import { UserCreate } from "./user-create";
import { UserInformation } from "./user-information";
import { formatFullName } from "@/features/shared/lib/format-name";

type UsersManagementProps = {
  users: UsersListItem[];
  selectedUser: UserDetail | null;
  ranks: AcademicRank[];
  campuses: CampusListItem[];
  colleges: CollegeListItem[];
  programOfferings: ProgramCampusOffering[];
  selectedId: string | null;
  isCreating: boolean;
  currentUserId: string | null;
};

type UserRoleFilter =
  | "all"
  | "internal-role"
  | "admin"
  | "program-chair"
  | "evaluators";

type UserRoleBadge = "Admin" | "Program Chairperson" | "Campus Director" | "VPAA" | "DI";

const roleFilters: Array<{ value: UserRoleFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "internal-role", label: "Internal Role" },
  { value: "admin", label: "Admin" },
  { value: "program-chair", label: "Programchair" },
  { value: "evaluators", label: "Evaluators" },
];

const normalizeDesignationTitle = (value: string | null | undefined) =>
  value?.trim().toLowerCase() ?? "";

const getUserRoleBadges = (user: UsersListItem): UserRoleBadge[] => {
  const badges = new Set<UserRoleBadge>();

  if (user.account_type === "Admin") {
    badges.add("Admin");
  }

  for (const designation of user.designations ?? []) {
    const title = normalizeDesignationTitle(designation.job_title);

    if (title === "program chairperson") {
      badges.add("Program Chairperson");
    }

    if (title === "campus director") {
      badges.add("Campus Director");
    }

    if (title === "vice president for academic affairs") {
      badges.add("VPAA");
    }

    if (title === "director for instruction") {
      badges.add("DI");
    }
  }

  return Array.from(badges);
};

const userMatchesRoleFilter = (user: UsersListItem, filter: UserRoleFilter) => {
  const badges = getUserRoleBadges(user);

  if (filter === "all") return true;
  if (filter === "internal-role") return badges.length > 0;
  if (filter === "admin") return badges.includes("Admin");
  if (filter === "program-chair") return badges.includes("Program Chairperson");
  return (
    badges.includes("Campus Director") ||
    badges.includes("VPAA") ||
    badges.includes("DI")
  );
};

const RoleBadges = ({ badges }: { badges: UserRoleBadge[] }) => {
  if (badges.length === 0) return null;

  return (
    <>
      {badges.map((badge) => (
        <span
          key={badge}
          className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium leading-none text-foreground"
        >
          {badge}
        </span>
      ))}
    </>
  );
};

export function UsersManagement({
  users,
  selectedUser,
  ranks,
  campuses,
  colleges,
  programOfferings,
  selectedId,
  isCreating,
  currentUserId,
}: UsersManagementProps) {
  const nav = useAdminManagementNavigation();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>("all");
  const [campusFilter, setCampusFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("all");

  const campusOptions = useMemo(
    () =>
      campuses
        .filter((campus) => users.some((user) => user.campus?.id === campus.id))
        .map((campus) => ({
          value: campus.id,
          label: campus.name,
        })),
    [campuses, users],
  );

  const collegeOptions = useMemo(
    () =>
      colleges
        .filter((college) =>
          users.some((user) => user.college?.id === college.id),
        )
        .map((college) => ({
          value: college.id,
          label: college.code ?? college.name,
        })),
    [colleges, users],
  );

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      if (!userMatchesRoleFilter(user, roleFilter)) return false;
      if (campusFilter !== "all" && user.campus?.id !== campusFilter) {
        return false;
      }
      if (collegeFilter !== "all" && user.college?.id !== collegeFilter) {
        return false;
      }
      if (!q) return true;

      return [
        formatFullName(user.identity) ?? "",
        user.email ?? "",
        user.campus?.name ?? "",
        user.college?.code ?? "",
        user.employment_status ?? "",
        getUserRoleBadges(user).join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [campusFilter, collegeFilter, query, roleFilter, users]);

  return (
    <ManagementContainer
      list={
        <AdminManagementList
          query={query}
          onQueryChange={setQuery}
          filters={
            <div className="flex items-center gap-2">
              <Funnel className="h-5 w-5 shrink-0 text-foreground/80" />
              <Select
                aria-label="Filter by role"
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value as UserRoleFilter)
                }
                className="min-w-0 flex-1 text-xs"
              
              >
                {roleFilters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </Select>
              <Select
                aria-label="Filter by campus"
                value={campusFilter}
                onChange={(event) => setCampusFilter(event.target.value)}
                className="min-w-0 flex-1 text-xs"
              >
                <option value="all">All Campuses</option>
                {campusOptions.map((campus) => (
                  <option key={campus.value} value={campus.value}>
                    {campus.label}
                  </option>
                ))}
              </Select>
              <Select
                aria-label="Filter by college"
                value={collegeFilter}
                onChange={(event) => setCollegeFilter(event.target.value)}
                className="min-w-0 flex-1 text-xs"
              >
                <option value="all">All Colleges</option>
                {collegeOptions.map((college) => (
                  <option key={college.value} value={college.value}>
                    {college.label}
                  </option>
                ))}
              </Select>
            </div>
          }
          selectedId={selectedId}
          createLabel="Create User"
          searchPlaceholder="Search by name, email, campus, or college"
          emptyMessage="No users match your search."
          onCreate={nav.openCreate}
          onSelect={nav.openItem}
          items={filteredUsers.map((user) => ({
            id: user.id,
            title: formatFullName(user.identity) ?? "Unknown User",
            subtitle: [
              `${
                user.college?.code ?? "No Default College"
              } - ${user.campus?.name ?? "No Home"} Campus`,
            ],
            icon: <User className="h-5 w-5" />,
            annotations: <RoleBadges badges={getUserRoleBadges(user)} />,
          }))}
        />
      }
      panel={{
        open: isCreating || Boolean(selectedId),
        title: isCreating
          ? "Create User"
          : formatFullName(selectedUser?.identity) ?? "User not found",

        content: isCreating ? (
          <UserCreate
            key="create-user"
            campuses={campuses}
            colleges={colleges}
            programOfferings={programOfferings}
            onCreated={(id) => {
              nav.refresh();
              nav.replaceWithItem(id);
            }}
            onCancel={nav.closePanel}
          />
        ) : selectedUser ? (
          <UserInformation
            key={selectedUser.id}
            user={selectedUser}
            ranks={ranks}
            campuses={campuses}
            colleges={colleges}
            programOfferings={programOfferings}
            currentUserId={currentUserId}
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
