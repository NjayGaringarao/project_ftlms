"use client";

import { useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import { ManagementContainer } from "@/components/layout/management-container";
import { AdminManagementList } from "@/features/admin/components/management/admin-management-list";
import { AdminInlineListSection } from "@/features/admin/components/management/admin-inline-list-section";
import { ManagementPlaceholder } from "@/features/admin/components/management/management-placeholder";
import { useAdminManagementNavigation } from "@/features/admin/hooks/use-admin-management-navigation";
import type { CampusListItem } from "@/features/admin/lib/campuses";
import type { ProgramOfferingListItem } from "@/features/admin/lib/program-offerings";
import type { ExtendedRoom } from "@/features/shared/types/models/room";
import type { ExtendedProgram } from "@/features/shared/types/models";
import {
  createCampus,
  createProgramOffering,
  createRoom,
  deleteCampus,
  deleteProgramOffering,
  deleteRoom,
  updateCampus,
  updateProgramOffering,
  updateRoom,
} from "@/features/admin/lib/actions";
import { CampusInitialForm, type CampusFormState } from "./campus-initial-form";
import FormStatusBanner from "../form-status-banner";
import DangerZone from "../danger-zone";
import DeleteConfirmModal from "../delete-confirm-modal";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCreatedRecordId } from "@/features/admin/lib/action-result-helpers";

type CampusesManagementProps = {
  campuses: CampusListItem[];
  selectedCampus: CampusListItem | null;
  rooms: ExtendedRoom[];
  offerings: ProgramOfferingListItem[];
  programs: ExtendedProgram[];
  selectedId: string | null;
  isCreating: boolean;
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

export function CampusesManagement({
  campuses,
  selectedCampus,
  rooms,
  offerings,
  programs,
  selectedId,
  isCreating,
}: CampusesManagementProps) {
  const nav = useAdminManagementNavigation();
  const [query, setQuery] = useState("");
  const filteredCampuses = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return campuses;
    return campuses.filter((campus) =>
      [campus.code, campus.name, campus.address ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [campuses, query]);

  return (
    <ManagementContainer
      list={
        <AdminManagementList
          query={query}
          onQueryChange={setQuery}
          selectedId={selectedId}
          createLabel="Create Campus"
          searchPlaceholder="Search campuses"
          emptyMessage="No campuses match your search."
          onCreate={nav.openCreate}
          onSelect={nav.openItem}
          items={filteredCampuses.map((campus) => ({
            id: campus.id,
            title: campus.name,
            subtitle: [campus.address || "No address"],
            icon: <Building2 className="h-5 w-5" />,
          }))}
        />
      }
      panel={{
        open: isCreating || Boolean(selectedId),
        title: isCreating
          ? "Create Campus"
          : selectedCampus?.name ?? "Campus not found",
        description: isCreating
          ? "Add a campus."
          : "Edit campus details and manage inline campus resources.",
        content: (
          <CampusPanel
            campus={selectedCampus}
            rooms={rooms}
            offerings={offerings}
            programs={programs}
            isCreating={isCreating}
            onClose={nav.closePanel}
            onCreated={nav.replaceWithItem}
            onRefresh={nav.refresh}
          />
        ),
        onOpenChange: (open) => {
          if (!open) nav.closePanel();
        },
      }}
      panelPlaceholder={
        <ManagementPlaceholder
          title="Select a campus"
          description="Campus fields, rooms, and program offerings will appear here."
        />
      }
    />
  );
}

function CampusPanel({
  campus,
  rooms,
  offerings,
  programs,
  isCreating,
  onClose,
  onCreated,
  onRefresh,
}: {
  campus: CampusListItem | null;
  rooms: ExtendedRoom[];
  offerings: ProgramOfferingListItem[];
  programs: ExtendedProgram[];
  isCreating: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
  onRefresh: () => void;
}) {
  const initial = toForm(campus);
  const [formData, setFormData] = useState<CampusFormState>(initial);
  const [savedFormData, setSavedFormData] = useState<CampusFormState>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roomDialogId, setRoomDialogId] = useState<string | "new" | null>(null);
  const [offeringDialogId, setOfferingDialogId] = useState<string | "new" | null>(
    null,
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
    setSuccess(isCreating ? "Campus created successfully" : "Campus updated successfully");
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

  if (!isCreating && !campus) {
    return <p className="text-sm text-foreground/70">Select another campus from the list.</p>;
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
          <AdminInlineListSection
            title="Rooms"
            emptyMessage="No rooms added for this campus."
            createLabel="Add Room"
            onCreate={() => setRoomDialogId("new")}
            onEdit={(id) => setRoomDialogId(id)}
            items={rooms.map((room) => ({
              id: room.id,
              title: room.code,
              description: room.name ?? "Unnamed room",
              meta: (
                <span className="text-xs text-foreground/70">
                  {room.capacity ?? 0} seats
                </span>
              ),
            }))}
          />
          <AdminInlineListSection
            title="Program Offerings"
            emptyMessage="No program offerings added for this campus."
            createLabel="Add Offering"
            onCreate={() => setOfferingDialogId("new")}
            onEdit={(id) => setOfferingDialogId(id)}
            items={offerings.map((offering) => ({
              id: offering.id,
              title: offering.program?.name ?? "Unknown program",
              description: offering.program?.college?.name ?? "No college",
              meta: (
                <span className="text-xs text-foreground/70">
                  {offering.program?.code ?? "No code"}
                </span>
              ),
            }))}
          />
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
            key={offeringDialogId ?? "closed-offering"}
            open={offeringDialogId !== null}
            offering={
              offerings.find((offering) => offering.id === offeringDialogId) ?? null
            }
            campusId={campus.id}
            programs={programs}
            onClose={() => setOfferingDialogId(null)}
            onRefresh={onRefresh}
          />
        </>
      ) : null}
    </div>
  );
}

function RoomDialog({
  open,
  room,
  campusId,
  onClose,
  onRefresh,
}: {
  open: boolean;
  room: ExtendedRoom | null;
  campusId: string;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [code, setCode] = useState(room?.code ?? "");
  const [name, setName] = useState(room?.name ?? "");
  const [capacity, setCapacity] = useState(String(room?.capacity ?? ""));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const isCreating = !room;

  const save = async () => {
    const parsedCapacity = capacity.trim() ? Number(capacity) : null;
    setIsSaving(true);
    setError("");
    const result = isCreating
      ? await createRoom({ campus_id: campusId, code, name, capacity: parsedCapacity })
      : await updateRoom({
          id: room.id,
          campus_id: campusId,
          code,
          name,
          capacity: parsedCapacity,
        });
    setIsSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onRefresh();
    onClose();
  };

  const remove = async () => {
    if (!room) return;
    setIsSaving(true);
    setError("");
    const result = await deleteRoom(room.id);
    setIsSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onRefresh();
    onClose();
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title={isCreating ? "Add Room" : "Edit Room"}
    >
      <div className="space-y-4">
        <FormStatusBanner variant="compact" error={error} />
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label className="text-xs" htmlFor="room-code">Room Code *</Label>
            <Input id="room-code" value={code} onChange={(event) => setCode(event.target.value)} />
          </div>
          <div>
            <Label className="text-xs" htmlFor="room-name">Room Name</Label>
            <Input id="room-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div>
            <Label className="text-xs" htmlFor="room-capacity">Capacity</Label>
            <Input
              id="room-capacity"
              type="number"
              min="0"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-between gap-2 border-t pt-4">
          {!isCreating ? (
            <Button type="button" variant="destructive" onClick={remove} disabled={isSaving}>
              Delete
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={save} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </AppDialog>
  );
}

function OfferingDialog({
  open,
  offering,
  campusId,
  programs,
  onClose,
  onRefresh,
}: {
  open: boolean;
  offering: ProgramOfferingListItem | null;
  campusId: string;
  programs: ExtendedProgram[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [programId, setProgramId] = useState(offering?.program_id ?? programs[0]?.id ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const isCreating = !offering;

  const save = async () => {
    setIsSaving(true);
    setError("");
    const result = isCreating
      ? await createProgramOffering({ campus_id: campusId, program_id: programId })
      : await updateProgramOffering({
          id: offering.id,
          campus_id: campusId,
          program_id: programId,
        });
    setIsSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onRefresh();
    onClose();
  };

  const remove = async () => {
    if (!offering) return;
    setIsSaving(true);
    setError("");
    const result = await deleteProgramOffering(offering.id);
    setIsSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onRefresh();
    onClose();
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title={isCreating ? "Add Program Offering" : "Edit Program Offering"}
    >
      <div className="space-y-4">
        <FormStatusBanner variant="compact" error={error} />
        <div>
          <Label className="text-xs" htmlFor="program-offering-program">
            Program *
          </Label>
          <select
            id="program-offering-program"
            className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={programId}
            onChange={(event) => setProgramId(event.target.value)}
          >
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.code} - {program.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-between gap-2 border-t pt-4">
          {!isCreating ? (
            <Button type="button" variant="destructive" onClick={remove} disabled={isSaving}>
              Delete
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={save} disabled={isSaving || !programId}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </AppDialog>
  );
}
