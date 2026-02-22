"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Term } from "@/models/term";
import { deleteTerm } from "@/lib/university/actions";

type TermViewProps = {
  term: Term;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

export const TermView = ({ term }: TermViewProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");

    const { error } = await deleteTerm(term.id);

    if (error) {
      setDeleteError(error);
      setIsDeleting(false);
      return;
    }

    setShowDeleteConfirm(false);
    router.push("/university/terms");
  };

  return (
    <Card className="mt-4 mr-4 overflow-hidden gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-foreground/10 py-6">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Term Information
        </CardTitle>
        <div className="flex flex-row items-center gap-4">
          <Link
            href={`/university/terms/${term.id}/edit`}
            className="text-foreground"
          >
            <Edit />
          </Link>
          <Link href="/university/terms" className="text-foreground">
            <X />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="overflow-y-auto flex flex-col gap-8 py-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Calendar className="w-5 h-5" />
            <h3 className="text-base font-semibold">Term Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-foreground/60">Academic Year</p>
              <p className="font-medium">{term.academic_year}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Term Order</p>
              <p className="font-medium">{term.order}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Start Date</p>
              <p className="font-medium">{formatDate(term.start)}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">End Date</p>
              <p className="font-medium">{formatDate(term.end)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-600">Danger Zone</h3>
          </div>

          <p className="text-xs text-foreground/60">
            Term deletion is blocked when schedules are still attached.
          </p>

          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="self-end"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Term
          </Button>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  Delete Term
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground/80">
                  Are you sure you want to delete
                  <strong>{` ${term.academic_year} - ${term.order}`}</strong>?
                </p>

                <p className="text-xs text-foreground/60">
                  If dependent schedules exist, this operation will be rejected.
                </p>

                {deleteError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-900">{deleteError}</p>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Term"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
