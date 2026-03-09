"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { UsersListItem } from "@/lib/users/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AdminListContainer from "../admin-list-container";
import ListItem from "../list-item";
import { User } from "lucide-react";

const formatStatus = (status: string | null) => {
  if (!status) return "Unspecified";
  return status
    .split("_")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
};

const uniqueStatuses = (users: UsersListItem[]) => {
  const set = new Set<string>();
  users.forEach((user) => {
    if (user.employment_status) set.add(user.employment_status);
  });
  return Array.from(set.values()).sort();
};

type UsersListProps = {
  users: UsersListItem[];
};

export const UsersList = ({ users }: UsersListProps) => {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const router = useRouter();

  // Extract user ID from pathname like /users/[id] or /users/[id]/edit
  const selectedUserId = useMemo(() => {
    const match = pathname.match(/\/users\/([^\/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const statuses = useMemo(() => uniqueStatuses(users), [users]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesStatus =
        statusFilter === "all" || user.employment_status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      const name = (user.identity?.name ?? "").toLowerCase();
      const email = user.email?.toLowerCase() ?? "";
      return name.includes(q) || email.includes(q);
    });
  }, [query, statusFilter, users]);

  return (
    <AdminListContainer
      header={
        <>
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Search by name or email"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All Employment</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
          </div>
          <Button asChild>
            <Link href="/users/create">Create User</Link>
          </Button>
        </>
      }
      isItemSelected={!!selectedUserId}
    >
      {filteredUsers.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-foreground/70">
          No users match your search.
        </div>
      )}
      {filteredUsers.map((user) => {
        const name = user.identity?.name ?? "Unknown User";
        const status = formatStatus(user.employment_status);
        const isSelected = selectedUserId === user.id;
        return (
          <ListItem
            key={user.id}
            onClick={() => router.push(`/users/${user.id}`)}
            title={name}
            subtitle={[`${user.email ?? "Email not available"} | ${status}`]}
            isSelected={isSelected}
            icon={<User className="h-14 w-14 text-background" />}
          />
        );
      })}
    </AdminListContainer>
  );
};
