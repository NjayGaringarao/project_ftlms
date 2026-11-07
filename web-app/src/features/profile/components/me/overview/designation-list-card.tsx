import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExtendedDesignation } from "@/features/shared/types/models/designation";
import DesignationInformationContent from "@/features/shared/components/user/designation-information-content";
import { DivideSquare } from "lucide-react";

type DesignationListCardProps = {
  designations: Omit<ExtendedDesignation, "user">[];
};

const DesignationListCard = ({ designations }: DesignationListCardProps) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-base">Designation</p>

      <DesignationInformationContent designations={designations} />
    </div>
  );
};

export default DesignationListCard;
