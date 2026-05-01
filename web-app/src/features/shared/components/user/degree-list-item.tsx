import { Degree } from "@/features/shared/types/models/degree";
import { Book, BookOpen, GraduationCap } from "lucide-react";

type DegreeListItemProps = {
  degree: Degree;
};

const DegreeListItem = ({ degree }: DegreeListItemProps) => {
  const graduationLabel =
    degree.year_graduated !== null ? String(degree.year_graduated) : "Ongoing";

  return (
    <div className="shadow rounded-lg flex flex-row items-center">
      <div className="p-3">
        {graduationLabel === "Ongoing" ? (
          <BookOpen className="w-8 h-8 text-foreground/60" />
        ) : (
          <GraduationCap className="w-8 h-8 text-foreground/60" />
        )}
      </div>

      <div className="p-3 flex-1">
        <p className="text-sm font-semibold wrap-break-word">{degree.title}</p>

        <p className="text-xs text-foreground/70 wrap-break-word">
          {degree.institution}
        </p>
      </div>
      <p className="text-xs text-foreground/60 p-3">{graduationLabel}</p>
    </div>
  );
};

export default DegreeListItem;
