"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { User } from "lucide-react";
import ListItemSmall from "@/components/ui/list-item-small";
import type { FacultyListItem } from "@/lib/course-loading/types";

type FacultyListProps = {
  facultyList: FacultyListItem[];
  academicTermId: string;
};

const toFixed = (v: number) => v.toFixed(2);

export const FacultyList = ({ facultyList, academicTermId }: FacultyListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const selectedId = useMemo(() => {
    const match = pathname.match(
      /\/faculty-teaching-load\/[^/]+\/faculty\/([^/]+)/,
    );
    return match ? match[1] : null;
  }, [pathname]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return facultyList;
    return facultyList.filter((faculty) => faculty.name.toLowerCase().includes(q));
  }, [facultyList, query]);

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <Input
        placeholder="Search faculty…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="shrink-0"
      />

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="p-4 text-center text-sm text-foreground/70">
            No faculty found.
          </p>
        )}

        {filtered.map((faculty) => (
          <ListItemSmall
            key={faculty.id}
            title={faculty.name}
            subtitle={[`${faculty.campus_name?.concat(" Campus") ?? "Campus not assigned"} ${faculty.college_code ? " | ".concat(faculty.college_code) : ""}`]}
            isSelected={selectedId === faculty.id}
            onClick={() =>
              router.push(
                `/faculty-teaching-load/${academicTermId}/faculty/${faculty.id}`,
              )
            }
            icon={<User className="h-6 w-6 text-background/70" />}
            annotations={
              <span className="text-xs text-foreground bg-foreground/10 px-1 py-1 rounded-md">
                TWL: {toFixed(faculty.total_working_load)}
              </span>
            }
          />
        ))}
      </div>
    </div>
  );
};
