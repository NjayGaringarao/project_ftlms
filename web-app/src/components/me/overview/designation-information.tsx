import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfessionalDesignation } from "@/lib/me/profile";
import { WeightTilde } from "lucide-react";
import { cn } from "@/utils/style";

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
              "lg:grid lg:grid-cols-2",
              "xl:grid-cols-3",
            )}
          >
            {designations.map((designation) => (
              <div
                key={designation.id}
                className="bg-foreground/5 border border-border rounded-lg p-3 flex flex-row justify-between"
              >
                <div className="flex flex-col flex-wrap items-start justify-between gap-1">
                  <p className="font-semibold">{designation.job_title}</p>

                  <div className="space-y-1">
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
                </div>
                <div className="flex flex-row items-center">
                  <p className="text-sm text-foreground/70">
                    {toFixedLoad(designation.load ?? 0)}
                  </p>
                  <WeightTilde className="h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DesignationInformation;
