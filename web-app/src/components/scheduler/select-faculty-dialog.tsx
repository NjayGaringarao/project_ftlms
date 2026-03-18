"use client";

import { useMemo, useState } from "react";
import { User } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import type { FacultyListItem } from "@/lib/course-loading/types";

type SelectFacultyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faculty: FacultyListItem[];
  selectedFacultyId: string | null;
  onSelectFaculty: (facultyId: string) => void;
};

const toFixed = (value: number) => value.toFixed(2);

const SelectFacultyDialog = ({
  open,
  onOpenChange,
  faculty,
  selectedFacultyId,
  onSelectFaculty,
}: SelectFacultyDialogProps) => {
  const [facultyQuery, setFacultyQuery] = useState("");

  const filteredFaculty = useMemo(() => {
    const normalized = facultyQuery.trim().toLowerCase();
    if (!normalized) return faculty;

    return faculty.filter((item) =>
      item.name.toLowerCase().includes(normalized),
    );
  }, [faculty, facultyQuery]);

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Select Faculty"
      description="Select faculty to map. You can select block and room independently."
      contentClassName="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden"
    >
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <Input
          placeholder="Search faculty"
          value={facultyQuery}
          onChange={(event) => setFacultyQuery(event.target.value)}
        />
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {filteredFaculty.map((item) => (
            <ListItemSmall
              key={item.id}
              title={item.name}
              subtitle={
                item.latest_degree_title
                  ? [item.latest_degree_title]
                  : ["No degree on file"]
              }
              isSelected={item.id === selectedFacultyId}
              onClick={() => onSelectFaculty(item.id)}
              icon={<User className="h-5 w-5 text-background/80" />}
              annotations={
                <span className="rounded-md bg-foreground/10 px-1.5 py-1 text-xs">
                  TWL: {toFixed(item.total_working_load)}
                </span>
              }
            />
          ))}
        </div>
      </div>
    </AppDialog>
  );
};

export default SelectFacultyDialog;
