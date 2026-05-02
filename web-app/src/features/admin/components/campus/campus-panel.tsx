"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { AddTile } from "@/components/ui/add-tile";
import type { CampusListItem } from "@/features/admin/lib/campuses";
import type { ProgramOfferingListItem } from "@/features/admin/lib/program-offerings";
import type { ExtendedRoom } from "@/features/shared/types/models/room";
import type { ExtendedProgram } from "@/features/shared/types/models";
import {
  createCampus,
  deleteCampus,
  deleteProgramOffering,
  deleteRoom,
  updateCampus,
} from "@/features/admin/lib/actions";
import { getCreatedRecordId } from "@/features/admin/lib/action-result-helpers";
import { CampusInitialForm, type CampusFormState } from "./campus-initial-form";
import { ResourceSection } from "./resource-section";
import { RoomDialog } from "./room-dialog";
import { OfferingDialog } from "./offering-dialog";
import FormStatusBanner from "../form-status-banner";
import DangerZone from "../danger-zone";
import DeleteConfirmModal from "../delete-confirm-modal";

type CampusPanelProps = {
  campus: CampusListItem | null;
  rooms: ExtendedRoom[];
  offerings: ProgramOfferingListItem[];
  programs: ExtendedProgram[];
  isCreating: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
  onRefresh: () => void;
};

const emptyForm: CampusFormState = { code: "", name: "", address: "" };
const toForm = (campus: CampusListItem | null): CampusFormState =>
  campus
    ? {
        code: campus.code,
        name: campus.name,
        address: campus.address ?? "",
      }
    : emptyForm;

export function CampusPanel({
  campus,
  rooms,
  offerings,
  programs,
  isCreating,
  onClose,
  onCreated,
  onRefresh,
}: CampusPanelProps) {
  const initial = toForm(campus);
  const [formData, setFormData] = useState<CampusFormState>(initial);
  const [savedFormData, setSavedFormData] = useState<CampusFormState>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roomDialogId, setRoomDialogId] = useState<string | "new" | null>(null);
  const [isOfferingDialogOpen, setIsOfferingDialogOpen] = useState(false);
  const [areRoomsOpen, setAreRoomsOpen] = useState(true);
  const [areOfferingsOpen, setAreOfferingsOpen] = useState(true);
  const [roomToDelete, setRoomToDelete] = useState<ExtendedRoom | null>(null);
  const [offeringToDelete, setOfferingToDelete] =
    useState<ProgramOfferingListItem | null>(null);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);
  const [isDeletingOffering, setIsDeletingOffering] = useState(false);
  const [roomDeleteError, setRoomDeleteError] = useState("");
  const [offeringDeleteError, setOfferingDeleteError] = useState("");
  const hasFormChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(savedFormData),
    [formData, savedFormData],
  );

  const handleSubmit = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");
    const result = isCreating
      ? await createCampus(formData)
      : campus
        ? await updateCampus({ id: campus.id, ...formData })
        : { error: "Campus not found" };
    setIsSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    const nextSaved = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      address: formData.address.trim(),
    };
    setSavedFormData(nextSaved);
    setFormData(nextSaved);
    setSuccess(
      isCreating
        ? "Campus created successfully"
        : "Campus updated successfully",
    );
    onRefresh();
    const createdId = "data" in result ? getCreatedRecordId(result.data) : null;
    if (isCreating && createdId) onCreated(createdId);
  };

  const handleDelete = async () => {
    if (!campus) return;
    setIsSaving(true);
    setError("");
    const result = await deleteCampus(campus.id);
    setIsSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowDeleteConfirm(false);
    onRefresh();
    onClose();
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    setIsDeletingRoom(true);
    setRoomDeleteError("");
    const result = await deleteRoom(roomToDelete.id);
    setIsDeletingRoom(false);
    if (result.error) {
      setRoomDeleteError(result.error);
      return;
    }
    setRoomToDelete(null);
    onRefresh();
  };

  const handleDeleteOffering = async () => {
    if (!offeringToDelete) return;
    setIsDeletingOffering(true);
    setOfferingDeleteError("");
    const result = await deleteProgramOffering(offeringToDelete.id);
    setIsDeletingOffering(false);
    if (result.error) {
      setOfferingDeleteError(result.error);
      return;
    }
    setOfferingToDelete(null);
    onRefresh();
  };

  if (!isCreating && !campus) {
    return (
      <p className="text-sm text-foreground/70">
        Select another campus from the list.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <CampusInitialForm
        formData={formData}
        onChange={(field, value) => {
          setFormData((current) => ({ ...current, [field]: value }));
          setError("");
        }}
        onReset={() => {
          setFormData(isCreating ? emptyForm : savedFormData);
          setError("");
          setSuccess("");
        }}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        submitLabel={isCreating ? "Create Campus" : "Save Changes"}
        submitLoadingLabel={isCreating ? "Creating..." : "Saving..."}
        showActions={hasFormChanges}
        statusSlot={
          <FormStatusBanner
            variant="compact"
            success={success ? { title: success } : undefined}
            error={error}
          />
        }
      />

      {!isCreating && campus ? (
        <>
          <ResourceSection
            title="Rooms"
            count={rooms.length}
            isOpen={areRoomsOpen}
            onToggle={() => setAreRoomsOpen((current) => !current)}
          >
             <AddTile
              title="Add Room"
              description="Create a room for this campus"
              onClick={() => setRoomDialogId("new")}
            />
           
            {rooms.length && (
              rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between gap-3 rounded-md border bg-background transition-colors hover:bg-foreground/5"
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 px-4 py-3 text-left"
                    onClick={() => setRoomDialogId(room.id)}
                  >
                    <p className="truncate text-sm font-semibold">
                      {room.name || room.code}
                    </p>
                    <p className="text-xs text-foreground/70">
                      {room.code} · {room.capacity ?? 0} seats
                    </p>
                  </button>
                  <button
                    type="button"
                    className="mr-3 rounded-md p-1.5 text-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setRoomDeleteError("");
                      setRoomToDelete(room);
                    }}
                    aria-label={`Delete ${room.name || room.code}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) }

            
          </ResourceSection>

          <ResourceSection
            title="Program Offerings"
            count={offerings.length}
            isOpen={areOfferingsOpen}
            onToggle={() => setAreOfferingsOpen((current) => !current)}
          >
             <AddTile
              title="Add Program Offering"
              description="Assign a program to this campus"
              onClick={() => setIsOfferingDialogOpen(true)}
            />
            
            {offerings.length && (
              offerings.map((offering) => (
                <div
                  key={offering.id}
                  className="flex items-center justify-between gap-3 rounded-md border bg-background px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      [{offering.program.code}] {offering.program?.name ?? "Unknown program"}
                    </p>
                    <p className="truncate text-xs text-foreground/70">
                      {offering.program?.college?.name ?? "No college assigned"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                   
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        setOfferingDeleteError("");
                        setOfferingToDelete(offering);
                      }}
                      aria-label={`Delete ${
                        offering.program?.name ?? "program offering"
                      }`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}

           
          </ResourceSection>

          <DangerZone
            description="Deleting this campus removes related rooms, program offerings, blocks, and linked designations."
            buttonLabel="Delete Campus"
            onDeleteClick={() => setShowDeleteConfirm(true)}
            disabled={isSaving}
          />
          <DeleteConfirmModal
            isOpen={showDeleteConfirm}
            title="Delete Campus"
            description={
              <p>
                Are you sure you want to delete <strong>{campus.name}</strong>?
              </p>
            }
            confirmLabel="Delete Campus"
            isDeleting={isSaving}
            error={error}
            onCancel={() => setShowDeleteConfirm(false)}
            onConfirm={handleDelete}
          />
          <RoomDialog
            key={roomDialogId ?? "closed-room"}
            open={roomDialogId !== null}
            room={rooms.find((room) => room.id === roomDialogId) ?? null}
            campusId={campus.id}
            onClose={() => setRoomDialogId(null)}
            onRefresh={onRefresh}
          />
          <OfferingDialog
            key={isOfferingDialogOpen ? "open-offering" : "closed-offering"}
            open={isOfferingDialogOpen}
            campusId={campus.id}
            programs={programs}
            onClose={() => setIsOfferingDialogOpen(false)}
            onRefresh={onRefresh}
          />
          <DeleteConfirmModal
            isOpen={roomToDelete !== null}
            title="Delete Room"
            description={
              <p>
                Are you sure you want to delete{" "}
                <strong>{roomToDelete?.name || roomToDelete?.code}</strong>?
              </p>
            }
            confirmLabel="Delete Room"
            isDeleting={isDeletingRoom}
            error={roomDeleteError}
            onCancel={() => {
              setRoomDeleteError("");
              setRoomToDelete(null);
            }}
            onConfirm={handleDeleteRoom}
          />
          <DeleteConfirmModal
            isOpen={offeringToDelete !== null}
            title="Delete Program Offering"
            description={
              <p>
                Are you sure you want to delete{" "}
                <strong>
                  {offeringToDelete?.program?.name ?? "this program offering"}
                </strong>
                ?
              </p>
            }
            confirmLabel="Delete Offering"
            isDeleting={isDeletingOffering}
            error={offeringDeleteError}
            onCancel={() => {
              setOfferingDeleteError("");
              setOfferingToDelete(null);
            }}
            onConfirm={handleDeleteOffering}
          />
        </>
      ) : null}
    </div>
  );
}
