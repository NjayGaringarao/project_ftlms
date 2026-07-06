import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

type ShortcutCardProps = {
  href: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
};

const ShortcutCard = ({
  href,
  label,
  description,
  icon: Icon,
}: ShortcutCardProps) => {
  return (
    <Link href={href} className="block min-w-0 group">
      <Card className="h-full transition-colors group-hover:bg-accent">
        <CardContent className="flex items-center gap-3">
          {Icon && <Icon className="w-6 h-6 shrink-0 text-foreground/70" />}
          <div className="min-w-0 flex-1">
            <p className="font-medium">{label}</p>
            {description && (
              <p className="text-sm text-foreground/60 truncate">
                {description}
              </p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 shrink-0 text-foreground/40" />
        </CardContent>
      </Card>
    </Link>
  );
};

export default ShortcutCard;
