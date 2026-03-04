import { Calendar } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/admin/list-item-small";
import {
  FTLBootstrapData,
  FTLFaculty,
  FTLOfferingOption,
} from "@/lib/ftl/types";
import { cn } from "@/utils/style";

type ContextPickersDialogsProps = {
  isFacultyPickerOpen: boolean;
  setIsFacultyPickerOpen: (open: boolean) => void;
  facultyQuery: string;
  setFacultyQuery: (value: string) => void;
  filteredFaculty: FTLFaculty[];
  fullName: (faculty: FTLFaculty | null) => string;
  onSelectFaculty: (facultyId: string) => void;

  isTermPickerOpen: boolean;
  setIsTermPickerOpen: (open: boolean) => void;
  termQuery: string;
  setTermQuery: (value: string) => void;
  filteredTerms: FTLBootstrapData["terms"];
  onSelectTerm: (termId: string) => void;

  isCampusPickerOpen: boolean;
  setIsCampusPickerOpen: (open: boolean) => void;
  campusQuery: string;
  setCampusQuery: (value: string) => void;
  filteredCampuses: FTLBootstrapData["campuses"];
  selectedCampusIds: string[];
  onChangeCampusIds: (campusIds: string[]) => void;

  isOfferingPickerOpen: boolean;
  setIsOfferingPickerOpen: (open: boolean) => void;
  offeringQuery: string;
  setOfferingQuery: (value: string) => void;
  filteredOfferingOptions: FTLOfferingOption[];
  isSaving: boolean;
  onSelectOffering: (option: FTLOfferingOption) => void;
};

export const ContextPickersDialogs = ({
  isFacultyPickerOpen,
  setIsFacultyPickerOpen,
  facultyQuery,
  setFacultyQuery,
  filteredFaculty,
  fullName,
  onSelectFaculty,
  isTermPickerOpen,
  setIsTermPickerOpen,
  termQuery,
  setTermQuery,
  filteredTerms,
  onSelectTerm,
  isCampusPickerOpen,
  setIsCampusPickerOpen,
  campusQuery,
  setCampusQuery,
  filteredCampuses,
  selectedCampusIds,
  onChangeCampusIds,
  isOfferingPickerOpen,
  setIsOfferingPickerOpen,
  offeringQuery,
  setOfferingQuery,
  filteredOfferingOptions,
  isSaving,
  onSelectOffering,
}: ContextPickersDialogsProps) => {
  return (
    <>
      <AppDialog
        open={isFacultyPickerOpen}
        onOpenChange={setIsFacultyPickerOpen}
        title="Select Faculty"
        description="Search and select one faculty"
      >
        <div className="space-y-3">
          <Input
            placeholder="Search faculty"
            value={facultyQuery}
            onChange={(event) => setFacultyQuery(event.target.value)}
          />
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {filteredFaculty.map((faculty) => (
              <button
                key={faculty.id}
                type="button"
                className="w-full rounded-md border p-2 text-left hover:bg-accent"
                onClick={() => {
                  onSelectFaculty(faculty.id);
                }}
              >
                <p className="text-sm font-medium">{fullName(faculty)}</p>
                <p className="text-xs text-foreground/70">
                  {faculty.employment_status} • Designation load{" "}
                  {faculty.total_designation_load}
                </p>
              </button>
            ))}
          </div>
        </div>
      </AppDialog>

      <AppDialog
        open={isTermPickerOpen}
        onOpenChange={setIsTermPickerOpen}
        title="Select Academic Term"
        description="Search and select one term"
        contentClassName="flex flex-col flex-1 max-h-11/12 w-full max-w-3xl overflow-hidden"
      >
        <div className="h-full flex flex-col gap-3 overflow-hidden">
          <Input
            placeholder="Search term"
            value={termQuery}
            onChange={(event) => setTermQuery(event.target.value)}
          />
          <div className="flex-1 grid grid-cols-2 gap-2 overflow-y-auto">
            {filteredTerms.map((term) => (
              <ListItemSmall
                key={term.id}
                title={term.code}
                subtitle={[]}
                onClick={() => {
                  onSelectTerm(term.id);
                }}
                icon={<Calendar className="h-6 w-6 text-background/70" />}
              />
            ))}
          </div>
        </div>
      </AppDialog>

      <AppDialog
        open={isCampusPickerOpen}
        onOpenChange={setIsCampusPickerOpen}
        title="Add Campuses"
        description="Search and add one or more campuses"
      >
        <div className="space-y-3">
          <Input
            placeholder="Search campus"
            value={campusQuery}
            onChange={(event) => setCampusQuery(event.target.value)}
          />
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {filteredCampuses.map((campus) => {
              const selected = selectedCampusIds.includes(campus.id);
              return (
                <button
                  key={campus.id}
                  type="button"
                  className={cn(
                    "w-full rounded-md border p-2 text-left",
                    selected
                      ? "border-primary bg-primary/10"
                      : "hover:bg-accent",
                  )}
                  onClick={() => {
                    const nextCampusIds = selected
                      ? selectedCampusIds.filter((item) => item !== campus.id)
                      : [...selectedCampusIds, campus.id];

                    onChangeCampusIds(nextCampusIds);
                  }}
                >
                  <p className="text-sm font-medium">{campus.name}</p>
                </button>
              );
            })}
          </div>
        </div>
      </AppDialog>

      <AppDialog
        open={isOfferingPickerOpen}
        onOpenChange={setIsOfferingPickerOpen}
        title="Add Class"
        description="Select a class; taken items are shown but disabled"
      >
        <div className="space-y-3">
          <Input
            placeholder="Search class"
            value={offeringQuery}
            onChange={(event) => setOfferingQuery(event.target.value)}
          />
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {filteredOfferingOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                disabled={item.is_taken || isSaving}
                className={cn(
                  "w-full rounded-md border p-2 text-left",
                  item.is_taken
                    ? "cursor-not-allowed border-border bg-muted text-foreground/60"
                    : "hover:bg-accent",
                )}
                onClick={() => onSelectOffering(item)}
              >
                <p className="text-sm font-medium">
                  {item.course_code} • {item.course_title}
                </p>
                <p className="text-xs text-foreground/70">
                  {item.campus_name} • {item.program_code ?? "N/A"} {" | "}
                  {item.major_code ?? "N/A"} {item.block_label}
                </p>
                <p className="text-xs text-foreground/70">
                  Course load = {item.lecture_hour ?? 0} + (
                  {item.laboratory_hour ?? 0} × 0.75)
                </p>
                {item.is_taken ? (
                  <p className="text-xs text-destructive">
                    Already assigned to:{" "}
                    {item.assigned_faculty_name ?? "Unknown Faculty"}
                  </p>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </AppDialog>
    </>
  );
};
