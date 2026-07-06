import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExecutiveActionItem } from "@/features/home/lib/types";
import { ChevronRight, Inbox } from "lucide-react";
import Link from "next/link";

type ActionListCardProps = {
  title: string;
  description?: string;
  items: ExecutiveActionItem[];
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

const ActionListCard = ({
  title,
  description,
  items,
  emptyLabel = "Nothing awaiting your evaluation.",
}: ActionListCardProps) => {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Inbox className="w-4 h-4" />
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
            {items.map((item) => (
              <Link
                key={item.loadId}
                href="/campus-college-load"
                className="flex items-center gap-3 border border-border rounded-lg p-3 transition-colors hover:bg-accent"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{item.scopeLabel}</p>
                  {item.submittedAt && (
                    <p className="text-xs text-foreground/60">
                      Submitted {formatDate(item.submittedAt)}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 text-foreground/40" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActionListCard;
