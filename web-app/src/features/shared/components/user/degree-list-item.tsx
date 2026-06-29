import { Degree } from "@/features/shared/types/models/degree";
import { GraduationCap } from "lucide-react";

type DegreeListItemProps = {
  degree: Degree;
};

const DegreeListItem = ({ degree }: DegreeListItemProps) => {
  return (
    <div className="shadow rounded-lg flex flex-row items-center">
      <div className="p-3">
        <GraduationCap className="w-8 h-8 text-foreground/60" />
      </div>

      <div className="p-3 flex-1">
        <p className="text-sm font-semibold wrap-break-word">{degree.title}</p>
        <p className="text-xs text-foreground/70">{degree.academic_level}</p>
      </div>
    </div>
  );
};

export default DegreeListItem;
