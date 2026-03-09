import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfessionalDesignation } from "@/lib/me/profile";
import { WeightTilde } from "lucide-react";
import { cn } from "@/utils/style";
import DesignationListItem from "@/components/users/designation-list-item";

type DesignationInformationProps = {
  designations: ProfessionalDesignation[];
};

const toFixedLoad = (value: number) => value.toFixed(2);

const DesignationInformation = ({
  designations,
}: DesignationInformationProps) => {
  return (
    <Card className="gap-1">
      <CardHeader>
        <CardTitle className="text-base">Designation</CardTitle>
      </CardHeader>
      <CardContent>
        {designations.length === 0 ? (
          <p className="text-sm text-foreground/60">No designation assigned.</p>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
};

export default DesignationInformation;
