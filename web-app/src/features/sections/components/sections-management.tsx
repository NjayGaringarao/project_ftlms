"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Blocks as Sections, ChevronDown, Sliders, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ManagementContainer } from "@/components/layout/management-container";
import CampusPickerDialog from "@/features/shared/components/pickers/campus-picker-dialog";
import ProgramOfferingPickerDialog from "@/features/shared/components/pickers/program-offering-picker-dialog";
import { AdminManagementList } from "@/features/admin/components/management/admin-management-list";
import { ManagementPlaceholder } from "@/features/admin/components/management/management-placeholder";
import type { SectionListItem } from "@/features/admin/lib/sections";
import type { CampusListItem } from "@/features/admin/lib/campuses";
import type { ProgramOfferingListItem } from "@/features/admin/lib/program-offerings";
import type { TermListItem } from "@/features/admin/lib/terms";
import type { FacultyListItem } from "@/features/course-loading/lib/types";
import { cn } from "@/utils/style";
import { SectionInformation } from "./section-information";

type SectionsManagementProps = {
  sections: SectionListItem[];
  campuses: CampusListItem[];
  programOfferings: ProgramOfferingListItem[];
  faculty: FacultyListItem[];
  academicTerm: TermListItem;
  selectedSection: SectionListItem | null;
  selectedId: string | null;
  isCreating: boolean;
};

export function SectionsManagement({
  sections,
  campuses,
  programOfferings,
  faculty,
  academicTerm,
  selectedSection,
  selectedId,
  isCreating,
}: SectionsManagementProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [campusDialogOpen, setCampusDialogOpen] = useState(false);
  const [programOfferingDialogOpen, setProgramOfferingDialogOpen] =
    useState(false);
  const [campusQuery, setCampusQuery] = useState("");
  const [programOfferingQuery, setProgramOfferingQuery] = useState("");

  const campusId = searchParams.get("campus_id") ?? "";
  const programOfferingId = searchParams.get("program_offering_id") ?? "";

  const navigateWithQuery = useCallback(
    (mutate: (next: URLSearchParams) => void, replace = false) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      const queryString = next.toString();
      const href = queryString ? `${pathname}?${queryString}` : pathname;
      if (replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
    },
    [pathname, router, searchParams],
  );

  const openCreate = () =>
    navigateWithQuery((next) => {
      next.delete("id");
      next.set("new", "1");
    });
  const openItem = (id: string) =>
    navigateWithQuery((next) => {
      next.delete("new");
      next.set("id", id);
    });
  const closePanel = () =>
    navigateWithQuery((next) => {
      next.delete("id");
      next.delete("new");
    });
  const replaceWithItem = (id: string) =>
    navigateWithQuery((next) => {
      next.delete("new");
      next.set("id", id);
    }, true);
  const refresh = () => router.refresh();

  useEffect(() => {
    if (!programOfferingId || campusId) return;
    const offering = programOfferings.find(
      (item) => item.id === programOfferingId,
    );
    if (!offering?.campus_id) return;
    navigateWithQuery((next) => {
      next.set("campus_id", offering.campus_id);
    }, true);
  }, [campusId, navigateWithQuery, programOfferingId, programOfferings]);

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

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();

    return sections.filter((section) => {
      if (section.academic_term_id !== academicTerm.id) return false;

      const sectionCampusId =
        section.major_offering?.program_offering?.campus_id ?? "";
      if (campusId && sectionCampusId !== campusId) return false;

      const sectionProgramOfferingId =
        section.major_offering?.program_offering?.id ?? "";
      if (programOfferingId && sectionProgramOfferingId !== programOfferingId) {
        return false;
      }

      if (!q) return true;

      const searchable = [
        section.code,
        section.name,
        `year ${section.year_level}`,
        section.major_offering?.major?.name ?? "",
        section.major_offering?.program_offering?.campus?.name ?? "",
        section.major_offering?.program_offering?.program?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [academicTerm.id, sections, campusId, programOfferingId, query]);

  const setCampus = (nextCampusId: string) => {
    navigateWithQuery((next) => {
      if (nextCampusId) {
        next.set("campus_id", nextCampusId);
      } else {
        next.delete("campus_id");
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
    }, true);
  };

  const setProgramOffering = (offering: ProgramOfferingListItem) => {
    navigateWithQuery((next) => {
      next.set("program_offering_id", offering.id);
      next.set("campus_id", offering.campus_id);
    }, true);
  };

  const renderFilterButton = (
    label: string,
    selectedLabel: string | null,
    onClick: () => void,
    onClear?: () => void,
  ) => (
    <div className="flex min-w-0 flex-1 items-center">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "min-w-0 flex-1 justify-between px-2 text-xs font-normal",
          selectedLabel ? "text-foreground" : "text-foreground/70",
        )}
        onClick={onClick}
      >
        <span className="truncate">{selectedLabel ?? label}</span>
        <ChevronDown className="h-3 w-3 text-foreground/60" />
      </Button>
      {selectedLabel && onClear ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-8 px-0"
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
      <ManagementContainer
        list={
          <AdminManagementList
            query={query}
            onQueryChange={setQuery}
            selectedId={selectedId}
            createLabel="Create Section"
            searchPlaceholder="Search sections"
            emptyMessage="No sections match your search."
            onCreate={openCreate}
            onSelect={openItem}
            filters={
              <div className="flex min-w-0 items-center gap-2">
                <Sliders className="h-4 min-w-4 text-foreground/60" />
                <div className="flex min-w-0 flex-1 gap-2">
                  {renderFilterButton(
                    "Campus",
                    selectedCampus ? selectedCampus.code : null,
                    () => {
                      setCampusQuery("");
                      setCampusDialogOpen(true);
                    },
                    campusId ? () => setCampus("") : undefined,
                  )}
                  {renderFilterButton(
                    "Program",
                    selectedProgramOffering
                      ? selectedProgramOffering.program?.code ?? "Program"
                      : null,
                    () => {
                      setProgramOfferingQuery("");
                      setProgramOfferingDialogOpen(true);
                    },
                    programOfferingId
                      ? () =>
                          navigateWithQuery((next) => {
                            next.delete("program_offering_id");
                          }, true)
                      : undefined,
                  )}
                </div>
              </div>
            }
            items={filteredSections.map((section) => ({
              id: section.id,
              title: section.code,
              subtitle: [
                `${section.major_offering?.program_offering?.campus?.name ?? "Unknown"} Campus`,
              ],
              icon: <Sections className="h-5 w-5" />,
              annotations: (
                <span className="flex items-center gap-1 rounded-xl bg-foreground/10 px-2 py-1 text-xs text-foreground">
                  <User className="h-3 w-3" />
                  {section.student_count ?? 0}
                </span>
              ),
            }))}
          />
        }
        panel={{
          open: isCreating || Boolean(selectedId),
          title: isCreating
            ? "Create Section"
            : (selectedSection?.code ?? "Section not found"),
          
          content: (
            <SectionInformation
              key={
                isCreating
                  ? `new-${campusId || "all"}`
                  : (selectedSection?.id ?? "missing")
              }
              section={selectedSection}
              academicTerm={academicTerm}
              campuses={campuses}
              programOfferings={programOfferings}
              faculty={faculty}
              isCreating={isCreating}
              fixedCampusId={campusId || undefined}
              onCreated={replaceWithItem}
              onDeleted={closePanel}
              onRefresh={refresh}
            />
          ),
          onOpenChange: (open) => {
            if (!open) closePanel();
          },
        }}
        panelPlaceholder={
          <ManagementPlaceholder
            title="Select a section"
            description="Section details and assigned courses will appear here."
          />
        }
      />

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
        emptyState={
          campusId
            ? "No program offerings found."
            : "Select a campus before filtering by program."
        }
      />
    </>
  );
}
