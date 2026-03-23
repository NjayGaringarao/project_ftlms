"use client";

import { useEffect, useMemo, useState } from "react";
import { User } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import ListItemSmall from "@/components/ui/list-item-small";
import type { FacultyListItem } from "@/lib/course-loading/types";

type FacultyPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  faculty: FacultyListItem[];
  selectedFacultyId?: string | null;
  onSelectFaculty: (facultyId: string) => void;
  defaultCampusId?: string | null;
  defaultCollegeId?: string | null;
};

const toFixed = (value: number) => value.toFixed(2);

const FacultyPickerDialog = ({
  open,
  onOpenChange,
  title,
  description,
  faculty,
  selectedFacultyId,
  onSelectFaculty,
  defaultCampusId,
  defaultCollegeId,
}: FacultyPickerDialogProps) => {
  const [facultyQuery, setFacultyQuery] = useState("");
  const [campusFilterId, setCampusFilterId] = useState("");
  const [collegeFilterId, setCollegeFilterId] = useState("");

  useEffect(() => {
    if (!open) return;
    setFacultyQuery("");
    setCampusFilterId(defaultCampusId ?? "");
    setCollegeFilterId(defaultCollegeId ?? "");
  }, [open, defaultCampusId, defaultCollegeId]);

  const campusOptions = useMemo(() => {
    const map = new Map<string, string>();
    faculty.forEach((item) => {
      if (item.campus_id) {
        map.set(item.campus_id, item.campus_name ?? "Unknown Campus");
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [faculty]);

  const collegeOptions = useMemo(() => {
    const map = new Map<string, string>();
    faculty.forEach((item) => {
      if (item.college_id) {
        map.set(item.college_id, item.college_name ?? "Unknown College");
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [faculty]);

  const filteredFaculty = useMemo(() => {
    const normalized = facultyQuery.trim().toLowerCase();
    return faculty.filter((item) => {
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
  }, [faculty, facultyQuery, campusFilterId, collegeFilterId]);

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      contentClassName="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden"
    >
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Search faculty"
            value={facultyQuery}
            onChange={(event) => setFacultyQuery(event.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={campusFilterId}
              onChange={(event) => setCampusFilterId(event.target.value)}
            >
              <option value="">All campuses</option>
              {campusOptions.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </Select>
            <Select
              value={collegeFilterId}
              onChange={(event) => setCollegeFilterId(event.target.value)}
            >
              <option value="">All colleges</option>
              {collegeOptions.map((college) => (
                <option key={college.id} value={college.id}>
                  {college.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1 text-[10px] text-foreground/70">
              {campusFilterId ? (
                <span className="rounded-full border border-foreground/10 bg-foreground/5 px-2 py-0.5">
                  Campus:{" "}
                  {campusOptions.find((campus) => campus.id === campusFilterId)
                    ?.name ?? "Selected"}
                </span>
              ) : (
                <span className="rounded-full border border-foreground/10 bg-foreground/5 px-2 py-0.5">
                  Campus: All
                </span>
              )}
              {collegeFilterId ? (
                <span className="rounded-full border border-foreground/10 bg-foreground/5 px-2 py-0.5">
                  College:{" "}
                  {collegeOptions.find((college) => college.id === collegeFilterId)
                    ?.name ?? "Selected"}
                </span>
              ) : (
                <span className="rounded-full border border-foreground/10 bg-foreground/5 px-2 py-0.5">
                  College: All
                </span>
              )}
            </div>
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
              subtitle={[
                item.latest_degree_title
                  ? item.latest_degree_title
                  : "No degree on file",
              ]}
              isSelected={item.id === selectedFacultyId}
              onClick={() => onSelectFaculty(item.id)}
              icon={<User className="h-5 w-5 text-background/80" />}
              annotations={
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-md bg-foreground/10 px-1.5 py-1 text-xs">
                    TWL: {toFixed(item.total_working_load)}
                  </span>
                  <div className="flex flex-wrap gap-1 text-[10px] text-foreground/60">
                    {item.campus_name ? (
                      <span className="rounded-full border border-foreground/10 px-1.5 py-0.5">
                        {item.campus_name}
                      </span>
                    ) : null}
                    {item.college_name ? (
                      <span className="rounded-full border border-foreground/10 px-1.5 py-0.5">
                        {item.college_name}
                      </span>
                    ) : null}
                  </div>
                </div>
              }
            />
          ))}
        </div>
      </div>
    </AppDialog>
  );
};

export default FacultyPickerDialog;
