import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExtendedDesignation } from "@/models/designation";
import DesignationInformationContent from "@/components/user/designation-information-content";

type DesignationListCardProps = {
  designations: Omit<ExtendedDesignation, "user">[];
};

const DesignationListCard = ({ designations }: DesignationListCardProps) => {
  return (
    <Card className="gap-1">
      <CardHeader>
        <CardTitle className="text-base">Designation</CardTitle>
      </CardHeader>
      <CardContent>
        <DesignationInformationContent designations={designations} />
      </CardContent>
    </Card>
  );
};

export default DesignationListCard;
