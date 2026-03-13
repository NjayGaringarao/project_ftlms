"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Blocks } from "lucide-react";
import ListItemSmall from "@/components/ui/list-item-small";
import type { CourseLoadingBlockListItem } from "@/lib/course-loading/types";

type BlockListProps = {
  blocks: CourseLoadingBlockListItem[];
  academicTermId: string;
};

export const BlockList = ({ blocks, academicTermId }: BlockListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [campusFilter, setCampusFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>("");

  const selectedId = useMemo(() => {
    const match = pathname.match(/\/course-loading\/[^/]+\/block\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  // Derive unique filter options
  const campusOptions = useMemo(() => {
    const set = new Map<string, { code: string; name: string }>();
    for (const b of blocks) {
      if (b.campus_id && b.campus_code && b.campus_name)
        set.set(b.campus_id, { code: b.campus_code, name: b.campus_name });
    }
    return Array.from(set, ([id, { code, name }]) => ({ id, code, name }));
  }, [blocks]);

  const yearOptions = useMemo(() => {
    const set = new Set<number>();
    for (const b of blocks) set.add(b.year_level);
    return Array.from(set).sort((a, b) => a - b);
  }, [blocks]);

  const filtered = useMemo(() => {
    let result = blocks;

    if (campusFilter) {
      result = result.filter((b) => b.campus_id === campusFilter);
    }
    if (yearFilter) {
      result = result.filter((b) => b.year_level === Number(yearFilter));
    }

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (b) =>
          b.code.toLowerCase().includes(q) ||
          b.program_offering_code.toLowerCase().includes(q),
      );
    }

    return result;
  }, [blocks, query, campusFilter, yearFilter]);

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <Input
        placeholder="Search blocks…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="shrink-0"
      />

      <div className="flex gap-2">
        <select
          value={campusFilter}
          onChange={(e) => setCampusFilter(e.target.value)}
          className="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs"
        >
          <option value="">All Campuses</option>
          {campusOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs"
        >
          <option value="">All Year Level</option>
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              Year {y}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="p-4 text-center text-sm text-foreground/70">
            No blocks found.
          </p>
        )}

        {filtered.map((b) => (
          <ListItemSmall
            key={b.id}
            title={b.code}
            subtitle={[`${b.student_count} Student(s)`]}
            isSelected={selectedId === b.id}
            onClick={() =>
              router.push(`/course-loading/${academicTermId}/block/${b.id}`)
            }
            icon={<Blocks className="h-6 w-6 text-background/70" />}
            annotations={
              <span className="text-xs bg-foreground/10 p-1 rounded-md">
                Unit: {b.total_unit.toFixed(2)}
              </span>
            }
          />
        ))}
      </div>
    </div>
  );
};
