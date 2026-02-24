"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rank } from "@/models/rank";
import { deleteRank } from "@/lib/university/actions";

type RankViewProps = {
  rank: Rank;
};

export const RankView = ({ rank }: RankViewProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");

    const { error } = await deleteRank(rank.id);

    if (error) {
      setDeleteError(error);
      setIsDeleting(false);
      return;
    }

    setShowDeleteConfirm(false);
    router.push("/academic-ranks");
  };

  return (
    <Card className="mt-4 mr-4 overflow-hidden gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-foreground/10 py-6">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Rank Information
        </CardTitle>
        <div className="flex flex-row items-center gap-4">
          <Link
            href={`/academic-ranks/${rank.id}/edit`}
            className="text-foreground"
          >
            <Edit />
          </Link>
          <Link href="/academic-ranks" className="text-foreground">
            <X />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="overflow-y-auto flex flex-col gap-8 py-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Trophy className="w-5 h-5" />
            <h3 className="text-base font-semibold">Rank Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-foreground/60">Rank Number</p>
              <p className="font-medium">{rank.number}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Title</p>
              <p className="font-medium">{rank.title}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-foreground/60">Description</p>
              <p className="font-medium">
                {rank.description || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-600">Danger Zone</h3>
          </div>

          <p className="text-xs text-foreground/60">
            Deleting this rank unassigns it from linked users.
          </p>

          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="self-end"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Rank
          </Button>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  Delete Rank
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground/80">
                  Are you sure you want to delete <strong>{rank.title}</strong>?
                  This action cannot be undone.
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
                    {isDeleting ? "Deleting..." : "Delete Rank"}
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
