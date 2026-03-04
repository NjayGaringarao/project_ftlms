import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/utils/time";

type Step4ReviewProps = {
  teachingLoadTotal: number;
  selectedFacultyDesignationLoad: number;
  totalWorkingLoad: number;
  updatedAt: string | null;
  disableSubmit: boolean;
  onSubmit: () => void;
};

export const Step4Review = ({
  teachingLoadTotal,
  selectedFacultyDesignationLoad,
  totalWorkingLoad,
  updatedAt,
  disableSubmit,
  onSubmit,
}: Step4ReviewProps) => {
  return (
    <Card>
      <CardHeader className="gap-0">
        <CardTitle className="text-base">Step 4: Review</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-3 flex-row">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-md border p-2 flex items-center gap-2">
            <p className="text-foreground/70">Teaching Load</p>
            <p className="text-sm font-semibold">
              {teachingLoadTotal.toFixed(2)}
            </p>
          </div>
          <div className="rounded-md border p-2 flex items-center gap-2">
            <p className="text-foreground/70">Designation Load</p>
            <p className="text-sm font-semibold">
              {selectedFacultyDesignationLoad.toFixed(2)}
            </p>
          </div>
          <div className="rounded-md border p-2 flex items-center gap-2">
            <p className="text-foreground/70">Total Working Load</p>
            <p className="text-sm font-semibold">
              {totalWorkingLoad.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-foreground/70 flex flex-1">
          Last Updated: {updatedAt ? formatDateTime(updatedAt) : "N/A"}
        </div>
        <Button onClick={onSubmit} disabled={disableSubmit}>
          <Send className="h-4 w-4" />
          Submit
        </Button>
      </CardContent>
    </Card>
  );
};
