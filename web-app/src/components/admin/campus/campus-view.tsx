"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Blocks,
  Building2,
  DoorOpen,
  GraduationCap,
  Info,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Campus } from "@/models/campus";
import { deleteCampus } from "@/lib/admin/actions";
import AdminPanel from "../admin-panel";
import DangerZone from "../danger-zone";
import DeleteConfirmModal from "../delete-confirm-modal";
import { cn } from "@/utils/style";

type CampusViewProps = {
  campus: Campus;
  defaultAcademicTermId?: string;
};

export const CampusView = ({
  campus,
  defaultAcademicTermId,
}: CampusViewProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const blocksUrl = defaultAcademicTermId
    ? `/blocks?campus_id=${campus.id}&academic_term_id=${defaultAcademicTermId}`
    : `/blocks?campus_id=${campus.id}`;

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");

    const { error } = await deleteCampus(campus.id);

    if (error) {
      setDeleteError(error);
      setIsDeleting(false);
      return;
    }

    setShowDeleteConfirm(false);
    router.push("/campuses");
  };

  return (
    <AdminPanel
      title="Campus Information"
      icon={Info}
      onClose={() => router.push("/campuses")}
      onEdit={() => router.push(`/campuses/${campus.id}/edit`)}
    >
      <>
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Building2 className="w-5 h-5" />
            <h3 className="text-base font-semibold">Campus Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-foreground/60 mt-0.5" />
              <div>
                <p className="text-xs text-foreground/60">Code</p>
                <p className="font-medium">{campus.code}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-foreground/60 mt-0.5" />
              <div>
                <p className="text-xs text-foreground/60">Name</p>
                <p className="font-medium">{campus.name}</p>
              </div>
            </div>

            <div className="md:col-span-2 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-foreground/60 mt-0.5" />
              <div>
                <p className="text-xs text-foreground/60">Address</p>
                <p className="font-medium">
                  {campus.address || "Not provided"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-sm font-semibold">Campus Entities</h4>
            <div className="grid grid-cols-3 gap-3">
              <button
                className={cn(
                  "relative h-20 rounded-md p-4",
                  "flex flex-row justify-start items-center gap-2",
                  "shadow border",
                  "hover:bg-foreground/5 hover:border-foreground/30",
                )}
                onClick={() =>
                  router.push(`/campuses/${campus.id}/program-offerings`)
                }
              >
                <GraduationCap className="w-10 h-10" />
                <span className="text-foreground font-medium">
                  Program Offerings
                </span>
                {/* <p className="min-w-10 p-2 bg-foreground/15 rounded-full text-xs">
                  {campus.rooms?.length || 0}
                </p> */}
                <ArrowUpRight className="w-6 h-6 absolute right-2 top-2 text-foreground/60" />
              </button>

              <button
                className={cn(
                  "relative h-20 rounded-md p-4",
                  "flex flex-row justify-start items-center gap-2",
                  "shadow border",
                  "hover:bg-foreground/5 hover:border-foreground/30",
                )}
                onClick={() => router.push(blocksUrl)}
              >
                <Blocks className="w-10 h-10" />
                <span className="text-foreground font-medium">Blocks</span>
                {/* <p className="min-w-10 p-2 bg-foreground/15 rounded-full text-xs">
                  {campus.rooms?.length || 0}
                </p> */}
                <ArrowUpRight className="w-6 h-6 absolute right-2 top-2 text-foreground/60" />
              </button>

              <button
                className={cn(
                  "relative h-20 rounded-md p-4",
                  "flex flex-row justify-start items-center gap-2",
                  "shadow border",
                  "hover:bg-foreground/5 hover:border-foreground/30",
                )}
                onClick={() => router.push(`/campuses/${campus.id}/rooms`)}
              >
                <DoorOpen className="w-10 h-10" />
                <span className="text-foreground font-medium">Rooms</span>
                {/* <p className="min-w-10 p-2 bg-foreground/15 rounded-full text-xs">
                  {campus.rooms?.length || 0}
                </p> */}
                <ArrowUpRight className="w-6 h-6 absolute right-2 top-2 text-foreground/60" />
              </button>
            </div>
          </div>
        </div>

        <DangerZone
          description={
            "Deleting this campus removes related rooms, program offerings, blocks, and linked designations."
          }
          buttonLabel="Delete Campus"
          onDeleteClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        />

        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete Campus"
          description={
            <p>
              Are you sure you want to delete <strong>{campus.name}</strong>?
              This action cannot be undone.
            </p>
          }
          confirmLabel="Delete Campus"
          isDeleting={isDeleting}
          error={deleteError}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      </>
    </AdminPanel>
  );
};
