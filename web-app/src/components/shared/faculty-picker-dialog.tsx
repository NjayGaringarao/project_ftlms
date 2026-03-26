"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, User, X } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import type { FacultyListItem } from "@/lib/course-loading/types";
import CampusPickerDialog from "@/components/shared/campus-picker-dialog";
import CollegePickerDialog from "@/components/shared/college-picker-dialog";
import { Button } from "@/components/ui/button";

type FacultyPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  items: FacultyListItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  searchPlaceholder?: string;
  defaultCampusId?: string | null;
  defaultCollegeId?: string | null;
  renderSubtitle?: (item: FacultyListItem) => string[];
  renderAnnotation?: (item: FacultyListItem) => ReactNode;
};

const toFixed = (value: number) => value.toFixed(2);

type FacultyPickerDialogBodyProps = {
  items: FacultyListItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  searchPlaceholder: string;
  defaultCampusId?: string | null;
  defaultCollegeId?: string | null;
  renderSubtitle?: (item: FacultyListItem) => string[];
  renderAnnotation?: (item: FacultyListItem) => ReactNode;
};

const FacultyPickerDialogBody = ({
  items,
  selectedId,
  onSelect,
  searchPlaceholder,
  defaultCampusId,
  defaultCollegeId,
  renderSubtitle,
  renderAnnotation,
}: FacultyPickerDialogBodyProps) => {
  const [facultyQuery, setFacultyQuery] = useState("");
  const [campusFilterId, setCampusFilterId] = useState(defaultCampusId ?? "");
  const [collegeFilterId, setCollegeFilterId] = useState(defaultCollegeId ?? "");
  const [campusDialogOpen, setCampusDialogOpen] = useState(false);
  const [collegeDialogOpen, setCollegeDialogOpen] = useState(false);
  const [campusQuery, setCampusQuery] = useState("");
  const [collegeQuery, setCollegeQuery] = useState("");

  const campusOptions = useMemo(() => {
    const map = new Map<string, { id: string; code: string; name: string }>();
    items.forEach((item) => {
      if (item.campus_id) {
        map.set(item.campus_id, {
          id: item.campus_id,
          code: item.campus_code ?? "",
          name: item.campus_name ?? "Unknown Campus",
        });
      }
    });
    return Array.from(map.values());
  }, [items]);

  const collegeOptions = useMemo(() => {
    const map = new Map<string, { id: string; code: string; name: string }>();
    items.forEach((item) => {
      if (item.college_id) {
        map.set(item.college_id, {
          id: item.college_id,
          code: item.college_code ?? "",
          name: item.college_name ?? "Unknown College",
        });
      }
    });
    return Array.from(map.values());
  }, [items]);

  const selectedCampus =
    campusOptions.find((campus) => campus.id === campusFilterId) ?? null;
  const selectedCollege =
    collegeOptions.find((college) => college.id === collegeFilterId) ?? null;

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
        className={selectedLabel ? "font-semibold flex-1" : "flex-1"}
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

  const filteredFaculty = useMemo(() => {
    const normalized = facultyQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (normalized && !item.name.toLowerCase().includes(normalized)) {
        return false;
      }
      if (campusFilterId && item.campus_id !== campusFilterId) {
        return false;
      }
      if (collegeFilterId && item.college_id !== collegeFilterId) {
        return false;
      }
      return true;
    });
  }, [items, facultyQuery, campusFilterId, collegeFilterId]);

  return (
    <>
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <div className="flex flex-col gap-2">
          <Input
            placeholder={searchPlaceholder}
            value={facultyQuery}
            onChange={(event) => setFacultyQuery(event.target.value)}
          />
          <div className="flex flex-row gap-2">
            {renderFilterButton(
              "All Campus",
              selectedCampus ? selectedCampus.code || selectedCampus.name : null,
              () => {
                setCampusQuery("");
                setCampusDialogOpen(true);
              },
              campusFilterId ? () => setCampusFilterId("") : undefined,
            )}
            {renderFilterButton(
              "All College",
              selectedCollege ? selectedCollege.code || selectedCollege.name : null,
              () => {
                setCollegeQuery("");
                setCollegeDialogOpen(true);
              },
              collegeFilterId ? () => setCollegeFilterId("") : undefined,
            )}

            <button
              type="button"
              className="text-xs text-foreground/60 hover:text-foreground"
              onClick={() => {
                setCampusFilterId("");
                setCollegeFilterId("");
              }}
            >
              Reset filters
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {filteredFaculty.map((item) => (
            <ListItemSmall
              key={item.id}
              title={item.name}
              subtitle={
                renderSubtitle
                  ? renderSubtitle(item)
                  : [
                      `${item.campus_name ?? "No Home"} Campus | ${item.college_name ?? "No Home College"}`,
                    ]
              }
              isSelected={item.id === selectedId}
              onClick={() => onSelect(item.id)}
              icon={<User className="h-5 w-5 text-background/80" />}
              annotations={
                renderAnnotation ? (
                  renderAnnotation(item)
                ) : (
                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-md bg-foreground/10 px-1.5 py-1 text-xs">
                      TWL: {toFixed(item.total_working_load)}
                    </span>
                  </div>
                )
              }
            />
          ))}
        </div>
      </div>

      <CampusPickerDialog
        open={campusDialogOpen}
        onOpenChange={setCampusDialogOpen}
        campuses={campusOptions.map((campus) => ({
          id: campus.id,
          code: campus.code,
          name: campus.name,
          address: null,
        }))}
        selectedCampusId={campusFilterId}
        query={campusQuery}
        onQueryChange={setCampusQuery}
        onSelect={(nextCampusId) => {
          setCampusFilterId(nextCampusId);
          setCampusDialogOpen(false);
        }}
        emptyState="No campuses found."
      />

      <CollegePickerDialog
        open={collegeDialogOpen}
        onOpenChange={setCollegeDialogOpen}
        colleges={collegeOptions.map((college) => ({
          id: college.id,
          code: college.code,
          name: college.name,
          description: null,
        }))}
        selectedCollegeId={collegeFilterId}
        query={collegeQuery}
        onQueryChange={setCollegeQuery}
        onSelect={(nextCollegeId) => {
          setCollegeFilterId(nextCollegeId);
          setCollegeDialogOpen(false);
        }}
        emptyState="No colleges found."
      />
    </>
  );
};

const FacultyPickerDialog = ({
  open,
  onOpenChange,
  title = "Select Faculty",
  description = "Select faculty.",
  items,
  selectedId,
  onSelect,
  searchPlaceholder = "Search faculty",
  defaultCampusId,
  defaultCollegeId,
  renderSubtitle,
  renderAnnotation,
}: FacultyPickerDialogProps) => {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      contentClassName="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden"
    >
      {open ? (
        <FacultyPickerDialogBody
          items={items}
          selectedId={selectedId}
          onSelect={onSelect}
          searchPlaceholder={searchPlaceholder}
          defaultCampusId={defaultCampusId}
          defaultCollegeId={defaultCollegeId}
          renderSubtitle={renderSubtitle}
          renderAnnotation={renderAnnotation}
        />
      ) : null}
    </AppDialog>
  );
};

export default FacultyPickerDialog;
