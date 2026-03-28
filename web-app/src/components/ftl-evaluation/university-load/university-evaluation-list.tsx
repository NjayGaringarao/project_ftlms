"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Landmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import type { CampusListItem } from "@/lib/admin/campuses";

type UniversityEvaluationListProps = {
  campuses: CampusListItem[];
  academicTermId: string;
};

const UniversityEvaluationList = ({
  campuses,
  academicTermId,
}: UniversityEvaluationListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const selectedId = useMemo(() => {
    const match = pathname.match(
      /\/ftl-evaluation\/[^/]+\/university-load\/([^/]+)/,
    );
    return match ? match[1] : null;
  }, [pathname]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return campuses;
    return campuses.filter((campus) => {
      const searchable = `${campus.code} ${campus.name}`.toLowerCase();
      return searchable.includes(q);
    });
  }, [campuses, query]);

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <Input
        placeholder="Search campus..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="shrink-0"
      />

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="p-4 text-center text-sm text-foreground/70">
            No campus found.
          </p>
        )}

        {filtered.map((campus) => (
          <ListItemSmall
            key={campus.id}
            title={campus.name}
            subtitle={[campus.address ?? ""]}
            isSelected={selectedId === campus.id}
            onClick={() =>
              router.push(
                `/ftl-evaluation/${academicTermId}/university-load/${campus.id}`,
              )
            }
            icon={<Landmark className="h-6 w-6 text-background/70" />}
          />
        ))}
      </div>
    </div>
  );
};

export default UniversityEvaluationList;
