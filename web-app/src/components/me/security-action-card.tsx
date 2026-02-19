"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LucideIcon,
  Info as InfoIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

interface SecurityActionCardProps {
  title: string;
  icon: LucideIcon;
  infoTitle?: string;
  infoDescription?: string;
  children: React.ReactNode;
}

export const SecurityActionCard = ({
  title,
  icon: Icon,
  infoTitle,
  infoDescription,
  children,
}: SecurityActionCardProps) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <Card className="flex-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {title}
          </CardTitle>
          {infoTitle && infoDescription && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
              className="text-foreground/60 hover:text-foreground"
            >
              <InfoIcon className="w-4 h-4 mr-1" />
              Info
              {showInfo ? (
                <ChevronUp className="w-4 h-4 ml-1" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-1" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Information Banner */}
          {showInfo && infoTitle && infoDescription && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <InfoIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 mb-1">{infoTitle}</p>
                <p className="text-blue-800">{infoDescription}</p>
              </div>
            </div>
          )}
          {children}
        </div>
      </CardContent>
    </Card>
  );
};
