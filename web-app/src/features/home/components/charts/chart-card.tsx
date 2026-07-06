import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/utils/style";
import { ReactNode } from "react";

type ChartCardProps = {
  title: string;
  description?: string;
  empty?: boolean;
  emptyLabel?: string;
  className?: string;
  children: ReactNode;
};

const ChartCard = ({
  title,
  description,
  empty = false,
  emptyLabel = "No data for this term.",
  className,
  children,
}: ChartCardProps) => {
  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && (
          <p className="text-sm text-foreground/60">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {empty ? (
          <p className="text-sm text-foreground/60 py-8 text-center">
            {emptyLabel}
          </p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};

export default ChartCard;
