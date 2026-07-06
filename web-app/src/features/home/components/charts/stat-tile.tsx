import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

type StatTileProps = {
  label: string;
  value: string | number;
  caption?: string;
  icon?: LucideIcon;
};

const StatTile = ({ label, value, caption, icon: Icon }: StatTileProps) => {
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" />}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
        {caption && (
          <p className="text-xs text-foreground/60 mt-1">{caption}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatTile;
