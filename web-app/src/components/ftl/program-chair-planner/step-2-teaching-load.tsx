import { Landmark, Merge, Split, X } from "lucide-react";
import { AddTile } from "@/components/ui/add-tile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FTLBootstrapData, FTLClass } from "@/lib/ftl/types";

type Step2TeachingLoadProps = {
  campuses: FTLBootstrapData["campuses"];
  selectedCampusIds: string[];
  classes: FTLClass[];
  mergeTargetsByClassId: Map<string, FTLClass[]>;
  isSaving: boolean;
  isLoadingOfferings: boolean;
  selectedTermId: string | null;
  offeringOptionsLength: number;
  selectedFacultyId: string | null;
  onRemoveCampus: (campusId: string) => void;
  onOpenCampusPicker: () => void;
  onRemoveClass: (item: FTLClass) => void;
  onOpenMerge: (classDeliveryId: string) => void;
  onOpenUnmerge: (classDeliveryId: string) => void;
  onOpenOfferingPicker: () => void;
};

export const Step2TeachingLoad = ({
  campuses,
  selectedCampusIds,
  classes,
  mergeTargetsByClassId,
  isSaving,
  isLoadingOfferings,
  selectedTermId,
  offeringOptionsLength,
  selectedFacultyId,
  onRemoveCampus,
  onOpenCampusPicker,
  onRemoveClass,
  onOpenMerge,
  onOpenUnmerge,
  onOpenOfferingPicker,
}: Step2TeachingLoadProps) => {
  return (
    <Card className="flex-1 gap-2 overflow-hidden flex flex-col">
      <CardHeader className="pb-2 gap-0">
        <CardTitle className="text-base">
          Step 2: Manage Teaching Load
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 overflow-auto space-y-3">
        <div className="space-y-1">
          <p className="text-xs text-foreground/70">Campuses</p>
          {selectedCampusIds.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedCampusIds.map((campusId) => {
                const campus = campuses.find((item) => item.id === campusId);
                if (!campus) return null;

                return (
                  <div
                    key={campusId}
                    className="rounded-md w-full border flex flex-row items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 p-4 text-sm">
                      <Landmark className="h-6 w-6 text-foreground/70" />
                      <p>{campus.name}</p>
                    </div>
                    <button
                      className="p-4"
                      onClick={() => onRemoveCampus(campusId)}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
          <AddTile
            title="Add Campus"
            description="Select one or more campuses"
            onClick={onOpenCampusPicker}
          />
        </div>

        <div className="space-y-1">
          <p className="text-xs text-foreground/70">Classes</p>

          {classes.map((item) => (
            <div
              key={`${item.id}-${item.course_offering_id}`}
              className="rounded-md w-full border flex flex-row items-center justify-between gap-2"
            >
              <div className="p-3 text-sm">
                <div className="flex flex-row gap-2 items-center">
                  <p className="font-medium">{item.course_code}</p>
                  <p className="text-xs text-foreground/70">
                    {item.program_code ?? "N/A"} {item.major_code ?? "N/A"}{" "}
                    {" | "}
                    {item.year_section ?? "No Block"}
                  </p>
                </div>
                <p className="text-xs text-foreground/70">
                  {`Load: ${(item.lecture_hour ?? 0) + (item.laboratory_hour ?? 0) * 0.75} ${(item.laboratory_hour ?? 0) * 0.75} = Lecture: ${item.lecture_hour ?? 0} + Laboratory: ${item.laboratory_hour ?? 0} × 0.75`}
                </p>
                <p className="text-xs text-emerald-700">
                  {(item.blocks.length ?? 0) > 1
                    ? `Merged Class with ${item.blocks.length} blocks`
                    : "Single class delivery"}
                </p>
              </div>

              <div className="p-2 flex flex-col items-center justify-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRemoveClass(item)}
                  disabled={isSaving}
                  title="Unassign this class from this faculty"
                >
                  <X className="h-5 w-5" />
                </Button>

                {(mergeTargetsByClassId.get(item.id)?.length ?? 0) > 0 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenMerge(item.id)}
                    disabled={isSaving}
                    title="Merge into another same-course class"
                  >
                    <Merge className="h-4 w-4" />
                  </Button>
                ) : null}

                {(item.blocks.length ?? 0) > 1 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenUnmerge(item.id)}
                    disabled={isSaving}
                    title="Unmerge into separate classes"
                  >
                    <Split className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          ))}

          {!isLoadingOfferings &&
          selectedTermId &&
          selectedCampusIds.length > 0 &&
          offeringOptionsLength === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-4 text-sm text-foreground/70">
              No offered courses found for selected term and campuses.
            </p>
          ) : null}

          <AddTile
            title="Add Class"
            description="Open searchable class list"
            onClick={onOpenOfferingPicker}
            disabled={
              !selectedFacultyId ||
              !selectedTermId ||
              selectedCampusIds.length === 0
            }
          />
        </div>
      </CardContent>
    </Card>
  );
};
