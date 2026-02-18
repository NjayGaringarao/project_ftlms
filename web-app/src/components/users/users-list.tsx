"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { UsersListItem } from "@/lib/users/users";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/utils/style";

const getFullName = (user: UsersListItem) => {
  const identity = user.identity;
  if (!identity) return "Unknown User";
  const parts = [
    identity.first_name,
    identity.middle_name,
    identity.last_name,
    identity.extension,
  ].filter(Boolean);
  return parts.join(" ");
};

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
      const name = getFullName(user).toLowerCase();
      const email = user.email?.toLowerCase() ?? "";
      return name.includes(q) || email.includes(q);
    });
  }, [query, statusFilter, users]);

  return (
    <div className="relative h-full flex flex-col">
      <CardHeader className="flex flex-col gap-4 bg-background/50 backdrop-blur-sm py-4 z-50 top-0 ">
        <div className="w-full flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
              <option value="all">All statuses</option>
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {filteredUsers.length === 0 && (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-foreground/70">
              No users match your search.
            </div>
          )}
          {filteredUsers.map((user) => {
            const name = getFullName(user);
            const status = formatStatus(user.employment_status);
            const isSelected = selectedUserId === user.id;
            return (
              <Link
                href={`/users/${user.id}`}
                passHref
                key={user.id}
                className={cn(
                  "flex flex-col gap-3 rounded-lg border p-4 transition hover:bg-foreground/5 hover:border-foreground/30 sm:flex-row sm:items-center sm:justify-between",
                  isSelected &&
                    "bg-foreground/10 border-foreground/40 font-semibold",
                )}
              >
                <div>
                  <div className="flex flex-row gap-4">
                    <p className="text-base font-semibold">{name}</p>{" "}
                    <span className="inline-flex rounded-full bg-foreground/10 px-3 py-1 text-xs text-foreground">
                      {status}
                    </span>
                  </div>

                  <p className="text-sm text-foreground/70">
                    {user.email ?? "Email not available"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </div>
  );
};
