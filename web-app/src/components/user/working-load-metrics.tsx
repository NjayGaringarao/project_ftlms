import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BriefcaseBusiness,
  Calculator,
  GraduationCap,
  WeightTilde,
} from "lucide-react";

type WorkingLoadMetricsProps = {
  designationLoad: number;
  actualTeachingLoad: number;
  totalWorkingLoad: number;
};

const toFixedLoad = (value: number) => value.toFixed(2);

const WorkingLoadMetrics = ({
  designationLoad,
  actualTeachingLoad,
  totalWorkingLoad,
}: WorkingLoadMetricsProps) => {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
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
              {toFixedLoad(designationLoad)}
            </p>
            <WeightTilde />
          </div>
          <p className="text-xs text-foreground/60 mt-1">
            Equivalent load units
          </p>
        </CardContent>
      </Card>

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
              {toFixedLoad(actualTeachingLoad)}
            </p>
            <WeightTilde />
          </div>
          <p className="text-xs text-foreground/60 mt-1">
            Lecture + (Laboratory * 0.75)
          </p>
        </CardContent>
      </Card>

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
              {toFixedLoad(totalWorkingLoad)}
            </p>
            <WeightTilde />
          </div>
          <p className="text-xs text-foreground/60 mt-1">ATL + ETL</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkingLoadMetrics;
