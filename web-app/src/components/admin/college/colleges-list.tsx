"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CollegeListItem } from "@/lib/admin/colleges";
import ListItem from "../list-item";
import { GraduationCap } from "lucide-react";
import { useListState } from "../../../hooks/useListState";
import AdminListContainer from "../admin-list-container";

type CollegesListProps = {
  colleges: CollegeListItem[];
};

export const CollegesList = ({ colleges }: CollegesListProps) => {
  const router = useRouter();
  const { query, setQuery, selectedId, filteredItems } = useListState({
    items: colleges,
    match: /\/colleges\/([^\/]+)/,
    filter: (items, rawQuery) => {
      const q = rawQuery.trim().toLowerCase();
      if (!q) return items;

      return items.filter((college) => {
        const code = college.code.toLowerCase();
        const name = college.name.toLowerCase();
        const description = college.description?.toLowerCase() ?? "";

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
            <Link href="/colleges/create">Create College</Link>
          </Button>
        </>
      }
      isItemSelected={!!selectedId}
    >
      {filteredItems.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-foreground/70">
          No colleges match your search.
        </div>
      )}

      {filteredItems.map((college) => {
        const isSelected = selectedId === college.id;

        return (
          <ListItem
            key={college.id}
            onClick={() => router.push(`/colleges/${college.id}`)}
            title={college.name}
            subtitle={[college.description || "No description available"]}
            isSelected={isSelected}
            icon={<GraduationCap className="h-14 w-14 text-background" />}
            annotations={
              <span className="inline-flex rounded-full bg-foreground/10 px-3 py-1 text-xs text-foreground">
                {college.code}
              </span>
            }
          />
        );
      })}
    </AdminListContainer>
  );
};

export const DepartmentsList = ({
  departments,
}: {
  departments: CollegeListItem[];
}) => <CollegesList colleges={departments} />;
