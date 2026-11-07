import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/utils/style";
import {
  BriefcaseBusiness,
  Calculator,
  GraduationCap,
  WeightTilde,
} from "lucide-react";

type WorkingLoadMetricsProps = {
  designationLoad?: number;
  actualTeachingLoad?: number;
  totalWorkingLoad?: number;
  isAvailable?: boolean;
  size?: "Default" | "Compact" | "Large";
};

const toFixedLoad = (value: number) => value.toFixed(2);

const WorkingLoadMetrics = ({
  designationLoad,
  actualTeachingLoad,
  totalWorkingLoad,
  isAvailable = true,
  size = "Default",
}: WorkingLoadMetricsProps) => {
  return (
    <div
      className={cn(
        "grid gap-4",
        size === "Large" && "grid-cols-2 2xl:grid-cols-3",
        size === "Default" && "md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3",
        size === "Compact" && "grid-cols-1",
      )}
    >
      {totalWorkingLoad !== undefined && totalWorkingLoad > -1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Total Working Load
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-row gap-2 items-center">
              <p className="text-3xl font-semibold">
                {isAvailable ? toFixedLoad(totalWorkingLoad) : "\u2014"}
              </p>
              <WeightTilde />
            </div>
            <p className="text-xs text-foreground/60 mt-1">ATL + ETL</p>
          </CardContent>
        </Card>
      )}

      {designationLoad !== undefined && designationLoad > -1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BriefcaseBusiness className="w-4 h-4" />
              Designation (ETL)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-row gap-2 items-center">
              <p className="text-3xl font-semibold">
                {isAvailable ? toFixedLoad(designationLoad) : "\u2014"}
              </p>
              <WeightTilde />
            </div>
            <p className="text-xs text-foreground/60 mt-1">
              Equivalent load units
            </p>
          </CardContent>
        </Card>
      )}

      {actualTeachingLoad !== undefined && actualTeachingLoad > -1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Actual Teaching Load (ATL)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-row gap-2 items-center">
              <p className="text-3xl font-semibold">
                {isAvailable ? toFixedLoad(actualTeachingLoad) : "\u2014"}
              </p>
              <WeightTilde />
            </div>
            <p className="text-xs text-foreground/60 mt-1">
              Lecture + (Laboratory * 3 * 0.75)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkingLoadMetrics;
