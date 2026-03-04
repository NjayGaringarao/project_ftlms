import { Calendar, UserCircle, X } from "lucide-react";
import { AddTile } from "@/components/ui/add-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Step1ContextProps = {
  facultyName: string | null;
  selectedFacultyId: string | null;
  selectedTermId: string | null;
  selectedTermCode: string | null;
  onClearFaculty: () => void;
  onOpenFacultyPicker: () => void;
  onClearTerm: () => void;
  onOpenTermPicker: () => void;
};

export const Step1Context = ({
  facultyName,
  selectedFacultyId,
  selectedTermId,
  selectedTermCode,
  onClearFaculty,
  onOpenFacultyPicker,
  onClearTerm,
  onOpenTermPicker,
}: Step1ContextProps) => {
  return (
    <Card className="gap-2">
      <CardHeader className="gap-0">
        <CardTitle>Step 1: Set Context</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 overflow-auto">
        <div className="space-y-1">
          <p className="text-xs text-foreground/70">Faculty</p>
          {selectedFacultyId && facultyName ? (
            <div
              key={selectedFacultyId}
              className="rounded-md w-full border flex flex-row items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 p-4 text-sm">
                <UserCircle className="h-6 w-6 text-foreground/70" />
                <p>{facultyName}</p>
              </div>
              <button className="p-4" onClick={onClearFaculty}>
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : null}

          {!selectedFacultyId && (
            <AddTile
              title="Select Faculty"
              description="Open searchable faculty list"
              onClick={onOpenFacultyPicker}
            />
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs text-foreground/70">Academic Term</p>
          {selectedTermId ? (
            <div
              key={selectedTermId}
              className="rounded-md w-full border flex flex-row items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 p-4 text-xs">
                <Calendar className="h-6 w-6 text-foreground/70" />
                <p>{selectedTermCode ?? ""}</p>
              </div>
              <button className="p-4" onClick={onClearTerm}>
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : null}

          {!selectedTermId && (
            <AddTile
              title="Select Academic Term"
              description="Open searchable term list"
              onClick={onOpenTermPicker}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
