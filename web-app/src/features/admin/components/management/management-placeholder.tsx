import type { ReactNode } from "react";

type ManagementPlaceholderProps = {
  title: string;
  description: ReactNode;
};

export function ManagementPlaceholder({
  title,
  description,
}: ManagementPlaceholderProps) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed bg-card/30 p-6 text-center">
      <div className="max-w-sm space-y-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-foreground/70">{description}</p>
      </div>
    </div>
  );
}
