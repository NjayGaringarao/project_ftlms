import { ExtendedDesignation } from "@/features/shared/types/models/designation";
import { BriefcaseBusiness, WeightTilde, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type DesignationListItemProps = {
  designation: Omit<ExtendedDesignation, "user">;
  showRemove?: boolean;
  removeDisabled?: boolean;
  onRemove?: () => void;
};

const DesignationListItem = ({
  designation,
  showRemove = false,
  removeDisabled = false,
  onRemove,
}: DesignationListItemProps) => {
  return (
    <div className="shadow rounded-lg flex flex-row items-center gap-2">
      <div className="p-3">
        <BriefcaseBusiness className="w-8 h-8 text-foreground/60" />
      </div>

      <div className="flex flex-col flex-wrap items-start justify-between text-xs p-3 flex-1">
        <p className="font-semibold text-sm">{designation.job_title}</p>

        {designation.campus && (
          <p className="font-medium text-foreground/60 wrap-break-word">
            {designation.campus.name} Campus
          </p>
        )}

        {designation.college && (
          <p className="font-medium text-foreground/60 wrap-break-word">
            {designation.college.name}
          </p>
        )}

        {designation.program && !designation.program_offering && (
          <p className="font-medium text-foreground/60 wrap-break-word">
            {designation.program.name}
          </p>
        )}

        {designation.program_offering && (
          <>
            <p className="font-medium text-foreground/60 wrap-break-word">
              {designation.program_offering.program.name}
            </p>
            <p className="font-medium text-foreground/60 wrap-break-word">
              {designation.program_offering.campus.name} Campus
            </p>
          </>
        )}
      </div>

      <div className="flex flex-col items-end p-3">
        {showRemove && onRemove && (
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={removeDisabled}
            >
              <X className="w-4 h-4 text-foreground" />
            </Button>
          </div>
        )}
        <div className="flex items-center">
          <p className="text-sm text-foreground/70">{designation.load ?? 0}</p>
          <WeightTilde className="h-4" />
        </div>
      </div>
    </div>
  );
};

export default DesignationListItem;
