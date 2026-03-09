import { ExtendedDesignation } from "@/models/designation";
import { cn } from "@/utils/style";
import DesignationListItem from "@/components/user/designation-list-item";

type BaseDesignation = Omit<ExtendedDesignation, "user">;

type DesignationInformationContentProps = {
  designations: BaseDesignation[];
};

const DesignationInformationContent = ({
  designations,
}: DesignationInformationContentProps) => {
  if (designations.length === 0) {
    return (
      <p className="text-sm text-foreground/60">No designation assigned.</p>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        "md:grid grid-cols-2",
        "xl:grid xl:grid-cols-2 2xl:grid-cols-3",
      )}
    >
      {designations.map((designation) => (
        <DesignationListItem key={designation.id} designation={designation} />
      ))}
    </div>
  );
};

export default DesignationInformationContent;
