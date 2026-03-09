import { ProfessionalDesignation } from "@/lib/me/profile";
import { ExtendedDesignation } from "@/models";
import { Degree } from "@/models/degree";
import { cn } from "@/utils/style";
import {
  Book,
  BookOpen,
  BriefcaseBusiness,
  GraduationCap,
  WeightTilde,
} from "lucide-react";

type DesignationListItemProps = {
  designation: ProfessionalDesignation;
};

const DesignationListItem = ({ designation }: DesignationListItemProps) => {
  const toFixedLoad = (value: number) => value.toFixed(2);

  return (
    <div className="shadow rounded-lg flex flex-row items-center">
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

        {designation.program && (
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
      <div className="flex flex-row items-center p-3">
        <p className="text-sm text-foreground/70">
          {toFixedLoad(designation.load ?? 0)}
        </p>
        <WeightTilde className="h-4" />
      </div>
    </div>
  );
};

export default DesignationListItem;
