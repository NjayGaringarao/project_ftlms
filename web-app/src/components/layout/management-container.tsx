"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AppDialog } from "@/components/ui/app-dialog";
import { cn } from "@/utils/style";
import { ManagementPanel } from "./management-panel";

export type ManagementContainerPanel = {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  content: ReactNode;
  presentation?: "panel" | "modal";
  onOpenChange?: (open: boolean) => void;
};

type ManagementContainerProps = {
  list: ReactNode;
  panel: ManagementContainerPanel;
  panelPlaceholder?: ReactNode;
  panelSticky?: boolean;
  desktopBreakpointPx?: number;
  className?: string;
};

export function ManagementContainer({
  list,
  panel,
  panelPlaceholder,
  panelSticky = true,
  desktopBreakpointPx = 1024,
  className,
}: ManagementContainerProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(min-width: ${desktopBreakpointPx}px)`,
    );
    const handleChange = () => setIsDesktop(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [desktopBreakpointPx]);

  const handleSurfaceOpenChange = (open: boolean) => {
    panel.onOpenChange?.(open);
  };
  const presentation = panel.presentation ?? "panel";
  const showInlinePanel = isDesktop && panel.open && presentation !== "modal";
  const isDialogOpen = panel.open && (!isDesktop || presentation === "modal");

  return (
    <>
      <div
        className={cn(
          "min-h-0 h-full overflow-hidden flex-1 p-4 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)]",
          className,
        )}
      >
        <section className="min-w-0 h-full overflow-hidden">{list}</section>
        <aside
          className={cn(
            "h-full hidden min-w-0 lg:flex flex-col justify-center",
            panelSticky ? "lg:sticky lg:top-6 xl:self-start" : "",
          )}
        >
          {showInlinePanel ? (
            <ManagementPanel
              title={panel.title}
              subtitle={panel.description}
              onClose={() => handleSurfaceOpenChange(false)}
            >
              {panel.content}
            </ManagementPanel>
          ) : (
            panelPlaceholder
          )}
        </aside>
      </div>

      <AppDialog
        open={isDialogOpen}
        onOpenChange={handleSurfaceOpenChange}
        title={panel.title}
        description={panel.description}
        contentClassName="max-h-[92vh] overflow-y-auto p-0"
        variant="full-screen"
      >
        <div className="px-4 py-4">{panel.content}</div>
      </AppDialog>
    </>
  );
}
