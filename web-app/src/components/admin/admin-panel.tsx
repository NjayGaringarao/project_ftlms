import { Edit, LucideIcon, X } from "lucide-react";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type AdminPanelProps = {
  title: string;
  icon: LucideIcon;
  onClose: () => void;
  onEdit?: () => void;
  children: React.ReactNode;
};

const AdminPanel = ({
  title,
  icon: Icon,
  onClose,
  onEdit,
  children,
}: AdminPanelProps) => {
  return (
    <Card className="overflow-hidden gap-0 m-0 p-0 h-full">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-foreground/10 py-6">
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          {title}
        </CardTitle>
        <div className="flex flex-row items-center gap-4">
          <button onClick={onClose} className="text-foreground">
            <X />
          </button>
          {onEdit && (
            <button onClick={onEdit} className="text-foreground">
              <Edit />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="overflow-y-auto flex flex-col gap-8 py-6">
        {children}
      </CardContent>
    </Card>
  );
};

export default AdminPanel;
