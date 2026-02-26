"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/utils/style";
import { DepartmentListItem } from "@/lib/admin/departments";
import ListItem from "./list-item";
import { GraduationCap, ToolCase } from "lucide-react";
import { useListState } from "../../hooks/useListState";
import AdminListContainer from "./admin-list-container";

type DepartmentsListProps = {
  departments: DepartmentListItem[];
};

export const DepartmentsList = ({ departments }: DepartmentsListProps) => {
  const router = useRouter();
  const { query, setQuery, selectedId, filteredItems } = useListState({
    items: departments,
    match: /\/departments\/([^\/]+)/,
    filter: (items, rawQuery) => {
      const q = rawQuery.trim().toLowerCase();
      if (!q) return items;

      return items.filter((department) => {
        const code = department.code.toLowerCase();
        const name = department.name.toLowerCase();
        const description = department.description?.toLowerCase() ?? "";

        return code.includes(q) || name.includes(q) || description.includes(q);
      });
    },
  });

  return (
    <AdminListContainer
      header={
        <>
          <Input
            placeholder="Search Departments by code or name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href="/departments/create">Create Department</Link>
          </Button>
        </>
      }
      isItemSelected={!!selectedId}
    >
      {filteredItems.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-foreground/70">
          No departments match your search.
        </div>
      )}

      {filteredItems.map((department) => {
        const isSelected = selectedId === department.id;
        const Icon = department.type === "ACADEMIC" ? GraduationCap : ToolCase;

        return (
          <ListItem
            key={department.id}
            onClick={() => router.push(`/departments/${department.id}`)}
            title={department.name}
            subtitle={[department.description || "No description available"]}
            isSelected={isSelected}
            icon={<Icon className="h-14 w-14 text-background" />}
            annotations={
              <span className="inline-flex rounded-full bg-foreground/10 px-3 py-1 text-xs text-foreground">
                {department.code}
              </span>
            }
          />
        );
      })}
    </AdminListContainer>
  );
};
