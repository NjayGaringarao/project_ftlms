import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FTL_STEP_LABEL,
  ftlStatusVariantClass,
  getFtlStatusLabel,
} from "@/features/home/lib/ftl-status";
import { FtlStatusItem } from "@/features/home/lib/types";
import { FileStack, MessageSquareWarning } from "lucide-react";
import Link from "next/link";

type FtlStatusListCardProps = {
  title: string;
  description?: string;
  items: FtlStatusItem[];
  emptyLabel?: string;
};

const formatDate = (value: string | null): string | null => {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const FtlStatusListCard = ({
  title,
  description,
  items,
  emptyLabel = "No campus-college loads for this term yet.",
}: FtlStatusListCardProps) => {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileStack className="w-4 h-4" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-foreground/60">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-foreground/60 py-4 text-center">
            {emptyLabel}
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => {
              const statusInfo = getFtlStatusLabel(item.status, item.step);
              const submitted = formatDate(item.latestSubmittedAt);
              return (
                <Link
                  key={item.id ?? `${item.scopeLabel}-${index}`}
                  href="/campus-college-load"
                  className="block border border-border rounded-lg p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{item.scopeLabel}</p>
                    {statusInfo ? (
                      <span
                        className={`text-xs rounded px-1.5 py-0.5 ${ftlStatusVariantClass[statusInfo.variant]}`}
                      >
                        {statusInfo.label}
                      </span>
                    ) : (
                      <span className="text-xs rounded px-1.5 py-0.5 border text-foreground/60">
                        Not started
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-foreground/60">
                    {item.step && item.step !== "COMPLETED" && (
                      <span>Current step: {FTL_STEP_LABEL[item.step]}</span>
                    )}
                    {submitted && <span>Last submitted {submitted}</span>}
                    {item.hasReturnComments && (
                      <span className="flex items-center gap-1 text-amber-700">
                        <MessageSquareWarning className="w-3.5 h-3.5" />
                        Evaluator comments
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FtlStatusListCard;
