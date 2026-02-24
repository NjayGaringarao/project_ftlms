"use client";

import { ReactNode } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type DangerZoneProps = {
  description: ReactNode;
  buttonLabel: string;
  onDeleteClick: () => void;
  disabled?: boolean;
};

const DangerZone = ({
  description,
  buttonLabel,
  onDeleteClick,
  disabled = false,
}: DangerZoneProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <h3 className="font-semibold text-red-600">Danger Zone</h3>
      </div>

      <div className="text-xs text-foreground/60">{description}</div>

      <Button
        variant="destructive"
        onClick={onDeleteClick}
        disabled={disabled}
        className="self-end"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        {buttonLabel}
      </Button>
    </div>
  );
};

export default DangerZone;
