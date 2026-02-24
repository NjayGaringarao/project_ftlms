"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/utils/style";
import { DepartmentListItem } from "@/lib/university/departments";

type DepartmentsListProps = {
  departments: DepartmentListItem[];
};

export const DepartmentsList = ({ departments }: DepartmentsListProps) => {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const selectedDepartmentId = useMemo(() => {
    const match = pathname.match(/\/departments\/([^\/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const filteredDepartments = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return departments;

    return departments.filter((department) => {
      const code = department.code.toLowerCase();
      const name = department.name.toLowerCase();
      const description = department.description?.toLowerCase() ?? "";

      return code.includes(q) || name.includes(q) || description.includes(q);
    });
  }, [departments, query]);

  return (
    <div className="relative h-full flex flex-col">
      <CardHeader className="flex flex-col gap-4 bg-background/50 backdrop-blur-sm py-4 z-50 top-0">
        <div className="w-full flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            placeholder="Search by code, name, or description"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href="/departments/create">Create Department</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "grid grid-cols-1 lg:grid-cols-3 gap-4",
            !!selectedDepartmentId && "flex flex-col gap-4",
          )}
        >
          {filteredDepartments.length === 0 && (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-foreground/70">
              No departments match your search.
            </div>
          )}

          {filteredDepartments.map((department) => {
            const isSelected = selectedDepartmentId === department.id;

            return (
              <Link
                key={department.id}
                href={`/departments/${department.id}`}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-4 transition hover:bg-foreground/5 hover:border-foreground/30",
                  isSelected &&
                    "bg-foreground/10 border-foreground/40 font-semibold",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-semibold">{department.name}</p>
                  <span className="inline-flex rounded-full bg-foreground/10 px-3 py-1 text-xs text-foreground">
                    {department.code}
                  </span>
                </div>
                <p className="text-sm text-foreground/70 line-clamp-2">
                  {department.description || "No description available"}
                </p>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </div>
  );
};
