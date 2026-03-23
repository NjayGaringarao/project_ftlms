"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useListState } from "@/hooks/useListState";
import ListItem from "../ui/list-item";
import CampusPickerDialog from "@/components/shared/campus-picker-dialog";
import ProgramOfferingPickerDialog from "@/components/shared/program-offering-picker-dialog";
import { Blocks, ChevronDown, Search, Sliders, User, X } from "lucide-react";
import { BlockListItem } from "@/lib/admin/blocks";
import { CampusListItem } from "@/lib/admin/campuses";
import { ProgramOfferingListItem } from "@/lib/admin/program-offerings";
import { cn } from "@/utils/style";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BlocksListProps = {
  blocks: BlockListItem[];
  campuses: CampusListItem[];
  programOfferings: ProgramOfferingListItem[];
  academicTermId: string;
  basePath?: string;
  createPath?: string;
};

export const BlocksList = ({
  blocks,
  campuses,
  programOfferings,
  academicTermId,
  basePath,
  createPath,
}: BlocksListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [campusDialogOpen, setCampusDialogOpen] = useState(false);
  const [programOfferingDialogOpen, setProgramOfferingDialogOpen] =
    useState(false);
  const [campusQuery, setCampusQuery] = useState("");
  const [programOfferingQuery, setProgramOfferingQuery] = useState("");

  const campusId = searchParams.get("campus_id") ?? "";
  const programOfferingId = searchParams.get("program_offering_id") ?? "";
  const resolvedBasePath = basePath ?? `/blocks/${academicTermId}`;
  const resolvedCreatePath =
    createPath ?? `/blocks/${academicTermId}/create`;

  const setQueryParams = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      const queryString = next.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const queryString = searchParams.toString();
  const withQuery = useCallback(
    (path: string) => (queryString ? `${path}?${queryString}` : path),
    [queryString],
  );

  useEffect(() => {
    if (!programOfferingId || campusId) return;
    const offering = programOfferings.find(
      (item) => item.id === programOfferingId,
    );
    if (!offering?.campus_id) return;
    setQueryParams((next) => {
      next.set("campus_id", offering.campus_id);
    });
  }, [campusId, programOfferingId, programOfferings, setQueryParams]);

  const selectedCampus =
    campuses.find((campus) => campus.id === campusId) ?? null;
  const selectedProgramOffering =
    programOfferings.find((offering) => offering.id === programOfferingId) ??
    null;

  const programOfferingsForCampus = useMemo(() => {
    if (!campusId) return [];
    return programOfferings.filter(
      (offering) => offering.campus_id === campusId,
    );
  }, [campusId, programOfferings]);

  const programOfferingOptions = useMemo(
    () =>
      programOfferingsForCampus.map((offering) => ({
        id: offering.id,
        campus_id: offering.campus_id,
        campus_code: offering.campus?.code ?? "",
        campus_name: offering.campus?.name ?? "",
        program_code: offering.program?.code ?? "",
        program_name: offering.program?.name ?? "",
      })),
    [programOfferingsForCampus],
  );

  const setCampus = (nextCampusId: string) => {
    setQueryParams((next) => {
      if (nextCampusId) {
        next.set("campus_id", nextCampusId);
      } else {
        next.delete("campus_id");
      }

      if (!nextCampusId) {
        next.delete("program_offering_id");
        return;
      }

      if (programOfferingId) {
        const offering = programOfferings.find(
          (item) => item.id === programOfferingId,
        );
        if (!offering || offering.campus_id !== nextCampusId) {
          next.delete("program_offering_id");
        }
      }
    });
  };

  const setProgramOffering = (offering: ProgramOfferingListItem) => {
    setQueryParams((next) => {
      next.set("program_offering_id", offering.id);
      next.set("campus_id", offering.campus_id);
    });
  };

  const clearProgramOffering = () => {
    setQueryParams((next) => {
      next.delete("program_offering_id");
    });
  };

  const idMatchPattern = useMemo(
    () =>
      new RegExp(
        `^${resolvedBasePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/([^/]+)(?:/|$)`,
      ),
    [resolvedBasePath],
  );
  const filterByParams = useCallback(
    (items: BlockListItem[]) => {
      return items.filter((block) => {
        if (academicTermId && block.academic_term_id !== academicTermId) {
          return false;
        }

        const blockCampusId =
          block.major_offering?.program_offering?.campus_id ?? "";
        if (campusId && blockCampusId !== campusId) {
          return false;
        }

        const blockProgramOfferingId =
          block.major_offering?.program_offering?.id ?? "";
        if (programOfferingId && blockProgramOfferingId !== programOfferingId) {
          return false;
        }

        return true;
      });
    },
    [academicTermId, campusId, programOfferingId],
  );

  const { query, setQuery, selectedId, filteredItems } = useListState({
    items: blocks,
    match: idMatchPattern,
    filter: (items, rawQuery) => {
      const scopedItems = filterByParams(items);
      const q = rawQuery.trim().toLowerCase();
      if (!q) return scopedItems;

      return scopedItems.filter((block) => {
        const code = block.code.toLowerCase();
        const major = block.major_offering?.major?.name?.toLowerCase() ?? "";
        const campus =
          block.major_offering?.program_offering?.campus?.name?.toLowerCase() ??
          "";
        const program =
          block.major_offering?.program_offering?.program?.name?.toLowerCase() ??
          "";
        const section = block.section.toLowerCase();
        const yearLevel = `year ${block.year_level}`;

        return (
          code.includes(q) ||
          major.includes(q) ||
          campus.includes(q) ||
          program.includes(q) ||
          section.includes(q) ||
          yearLevel.includes(q)
        );
      });
    },
  });

  useEffect(() => {
    if (!campusDialogOpen) return;
    setCampusQuery("");
  }, [campusDialogOpen]);

  useEffect(() => {
    if (!programOfferingDialogOpen) return;
    setProgramOfferingQuery("");
  }, [programOfferingDialogOpen]);

  const renderFilterButton = (
    label: string,
    selectedLabel: string | null,
    onClick: () => void,
    onClear?: () => void,
  ) => (
    <div className="flex items-center flex-1">
      <Button
        variant="outline"
        size="xs"
        className={cn(
          "px-2 text-xs flex-1 justify-between",
          selectedLabel ? "font-semibold" : "text-foreground/70",
        )}
        onClick={onClick}
      >
        <span className="truncate">{selectedLabel ?? label}</span>
        <ChevronDown className="h-3 w-3 text-foreground/60" />
      </Button>
      {selectedLabel && onClear ? (
        <Button
          variant="ghost"
          size="xs"
          className="w-8"
          onClick={onClear}
          title={`Clear ${label}`}
        >
          <X className="h-3 w-3 text-foreground/60" />
        </Button>
      ) : null}
    </div>
  );

  return (
    <>
      <Card className="flex h-full flex-col gap-0 w-full overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between mb-4">
          <CardTitle>Blocks</CardTitle>
          <Button asChild size={"sm"}>
            <Link href={withQuery(resolvedCreatePath)}>Create Block</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-4 flex flex-col gap-2 w-full">
          
          <div className="flex min-w-0 flex-row items-center gap-2">
            <Search className="h-4 min-w-4 text-foreground/60" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search blocks"
              className="h-8"
            />
          </div>
          <div className="flex min-w-0 flex-row items-center gap-2">
            <Sliders className="h-4 min-w-5 text-foreground/60" />
            <div className="flex flex-row flex-1 gap-1">
              {renderFilterButton(
                "Campus",
                selectedCampus ? selectedCampus.code : null,
                () => setCampusDialogOpen(true),
                campusId ? () => setCampus("") : undefined,
              )}

              {campusId
                ? renderFilterButton(
                    "Program Offering",
                    selectedProgramOffering
                      ? `${selectedProgramOffering.program?.code ?? "Program"}`
                      : null,
                    () => setProgramOfferingDialogOpen(true),
                    programOfferingId ? clearProgramOffering : undefined,
                  )
                : null}
            </div>
          </div>
        </CardContent>

        <CardContent className="flex flex-col flex-1 gap-2 overflow-y-auto p-4">
          {filteredItems.length === 0 && (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-foreground/70">
              No blocks match your search.
            </div>
          )}

          {filteredItems.map((block) => (
            <ListItem
              key={block.id}
              onClick={() =>
                router.push(withQuery(`${resolvedBasePath}/${block.id}`))
              }
              title={`${block.code}`}
              subtitle={[
                `${block.major_offering?.program_offering?.campus?.name ?? "Unknown"} Campus`,
              ]}
              isSelected={selectedId === block.id}
              icon={<Blocks className="h-14 w-14 text-background" />}
              annotations={
                <span className="flex flex-row text-xs text-foreground bg-foreground/10 py-1 px-2 rounded-xl">
                  <User className="h-4 w-3 mr-1 " /> {block.student_count}
                </span>
              }
            />
          ))}
        </CardContent>
      </Card>
      

      <CampusPickerDialog
        open={campusDialogOpen}
        onOpenChange={setCampusDialogOpen}
        campuses={campuses}
        selectedCampusId={campusId}
        query={campusQuery}
        onQueryChange={setCampusQuery}
        onSelect={(nextCampusId) => {
          setCampus(nextCampusId);
          setCampusDialogOpen(false);
        }}
        emptyState="No campuses found."
      />

      <ProgramOfferingPickerDialog
        open={programOfferingDialogOpen}
        onOpenChange={setProgramOfferingDialogOpen}
        programOfferings={programOfferingOptions}
        selectedProgramOfferingId={programOfferingId}
        query={programOfferingQuery}
        onQueryChange={setProgramOfferingQuery}
        onSelect={(offeringId) => {
          const offering = programOfferingsForCampus.find(
            (item) => item.id === offeringId,
          );
          if (offering) {
            setProgramOffering(offering);
          }
          setProgramOfferingDialogOpen(false);
        }}
        emptyState="No program offerings found."
      />
    </>
  );
};
