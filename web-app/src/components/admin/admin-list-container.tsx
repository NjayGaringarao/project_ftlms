import React from "react";
import { CardContent, CardHeader } from "../ui/card";
import { cn } from "@/utils/style";

type AdminListProps = {
  header: React.ReactNode;
  children: React.ReactNode;
  isItemSelected?: boolean;
  directoryLevel?: "FIRST" | "SECOND" | "THIRD";
};

const AdminListContainer = ({
  header,
  children,
  isItemSelected,
  directoryLevel = "FIRST",
}: React.PropsWithChildren<AdminListProps>) => {
  return (
    <div className="relative h-full flex flex-col gap-4">
      <CardHeader className="flex flex-col gap-4 bg-background/50 backdrop-blur-sm p-0 z-50 top-0">
        <div className="w-full flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {header}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          className={cn(
            "grid gap-4",
            directoryLevel === "FIRST" && "grid-cols-1 lg:grid-cols-3",
            directoryLevel === "SECOND" && "grid-cols-1 lg:grid-cols-2",
            directoryLevel === "THIRD" && "grid-cols-1",
            isItemSelected && "flex flex-col gap-4",
          )}
        >
          {children}
        </div>
      </CardContent>
    </div>
  );
};

export default AdminListContainer;
