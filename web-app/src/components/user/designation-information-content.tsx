import { ExtendedDesignation } from "@/models/designation";
import { cn } from "@/utils/style";
import { ReactNode } from "react";
import DesignationListItem from "@/components/user/designation-list-item";

type BaseDesignation = Omit<ExtendedDesignation, "user">;

type DesignationInformationContentProps = {
  designations: BaseDesignation[];
  onRemove?: (index: number) => void;
  removeDisabled?: boolean;
  trailingContent?: ReactNode;
  emptyMessage?: string;
};

const DesignationInformationContent = ({
  designations,
  onRemove,
  removeDisabled = false,
  trailingContent,
  emptyMessage = "No designation assigned.",
}: DesignationInformationContentProps) => {
  if (designations.length === 0 && !trailingContent) {
    return <p className="text-sm text-foreground/60">{emptyMessage}</p>;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        "md:grid grid-cols-2",
        "xl:grid xl:grid-cols-2 2xl:grid-cols-3",
      )}
    >
      {designations.map((designation, index) => (
        <DesignationListItem
          key={designation.id ?? `designation-${index}`}
          designation={designation}
          showRemove={Boolean(onRemove)}
          removeDisabled={removeDisabled}
          onRemove={onRemove ? () => onRemove(index) : undefined}
        />
      ))}

      {trailingContent}
    </div>
  );
};

export default DesignationInformationContent;
