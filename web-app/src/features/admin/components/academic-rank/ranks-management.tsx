"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { ManagementContainer } from "@/components/layout/management-container";
import { AdminManagementList } from "@/features/admin/components/management/admin-management-list";
import { ManagementPlaceholder } from "@/features/admin/components/management/management-placeholder";
import { useAdminManagementNavigation } from "@/features/admin/hooks/use-admin-management-navigation";
import type { RankListItem } from "@/features/admin/lib/ranks";
import { RankInitialForm, type RankFormState } from "./rank-initial-form";
import FormStatusBanner from "../form-status-banner";
import DangerZone from "../danger-zone";
import DeleteConfirmModal from "../delete-confirm-modal";
import { createRank, deleteRank, updateRank } from "@/features/admin/lib/actions";
import { getCreatedRecordId } from "@/features/admin/lib/action-result-helpers";

type RanksManagementProps = {
  ranks: RankListItem[];
  selectedRank: RankListItem | null;
  selectedId: string | null;
  isCreating: boolean;
};

const emptyForm: RankFormState = { code: "", title: "", description: "" };
const toForm = (rank: RankListItem | null): RankFormState =>
  rank
    ? {
        code: rank.code,
        title: rank.title,
        description: rank.description ?? "",
      }
    : emptyForm;

export function RanksManagement({
  ranks,
  selectedRank,
  selectedId,
  isCreating,
}: RanksManagementProps) {
  const nav = useAdminManagementNavigation();
  const [query, setQuery] = useState("");

  const filteredRanks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ranks;
    return ranks.filter((rank) =>
      [rank.code, rank.title, rank.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query, ranks]);

  const panelOpen = isCreating || Boolean(selectedId);
  const panelTitle = isCreating
    ? "Create Rank"
    : selectedRank?.title ?? "Rank not found";

  return (
    <ManagementContainer
      list={
        <AdminManagementList
          query={query}
          onQueryChange={setQuery}
          selectedId={selectedId}
          createLabel="Create Rank"
          searchPlaceholder="Search ranks"
          emptyMessage="No ranks match your search."
          onCreate={nav.openCreate}
          onSelect={nav.openItem}
          items={filteredRanks.map((rank) => ({
            id: rank.id,
            title: ` ${rank.title}`,
            subtitle: [rank.description || "No description"],
            icon: <Trophy className="h-5 w-5" />,
          }))}
        />
      }
      panel={{
        open: panelOpen,
        title: panelTitle,
        description: isCreating ? "Add a university academic rank." : "Edit academic rank details.",
        content: (
          <RankPanel
            rank={selectedRank}
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
          title="Select a rank"
          description="Rank details and editable fields will appear here."
        />
      }
    />
  );
}

function RankPanel({
  rank,
  isCreating,
  onClose,
  onCreated,
  onRefresh,
}: {
  rank: RankListItem | null;
  isCreating: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
  onRefresh: () => void;
}) {
  const initial = toForm(rank);
  const [formData, setFormData] = useState<RankFormState>(initial);
  const [savedFormData, setSavedFormData] = useState<RankFormState>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleChange = (field: keyof RankFormState, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const handleReset = () => {
    setFormData(isCreating ? emptyForm : savedFormData);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");
    const result = isCreating
      ? await createRank(formData)
      : rank
        ? await updateRank({ id: rank.id, ...formData })
        : { error: "Rank not found" };
    setIsSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const nextSaved = {
      code: formData.code.trim().toUpperCase(),
      title: formData.title.trim(),
      description: formData.description.trim(),
    };
    setSavedFormData(nextSaved);
    setFormData(nextSaved);
    setSuccess(isCreating ? "Rank created successfully" : "Rank updated successfully");
    onRefresh();
    const createdId = "data" in result ? getCreatedRecordId(result.data) : null;
    if (isCreating && createdId) {
      onCreated(createdId);
    }
  };

  const handleDelete = async () => {
    if (!rank) return;
    setIsSaving(true);
    setError("");
    const result = await deleteRank(rank.id);
    setIsSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowDeleteConfirm(false);
    onRefresh();
    onClose();
  };

  if (!isCreating && !rank) {
    return <p className="text-sm text-foreground/70">Select another rank from the list.</p>;
  }

  return (
    <div className="space-y-4">
      <RankInitialForm
        formData={formData}
        onChange={handleChange}
        onReset={handleReset}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        submitLabel={isCreating ? "Create Rank" : "Save Changes"}
        submitLoadingLabel={isCreating ? "Creating..." : "Saving..."}
        statusSlot={
          <FormStatusBanner
            variant="compact"
            success={success ? { title: success } : undefined}
            error={error}
          />
        }
      />
      {!isCreating && rank ? (
        <>
          <DangerZone
            description="Deleting this rank removes it from faculty profile options."
            buttonLabel="Delete Rank"
            onDeleteClick={() => setShowDeleteConfirm(true)}
            disabled={isSaving}
          />
          <DeleteConfirmModal
            isOpen={showDeleteConfirm}
            title="Delete Rank"
            description={
              <p>
                Are you sure you want to delete <strong>{rank.title}</strong>?
              </p>
            }
            confirmLabel="Delete Rank"
            isDeleting={isSaving}
            error={error}
            onCancel={() => setShowDeleteConfirm(false)}
            onConfirm={handleDelete}
          />
        </>
      ) : null}
    </div>
  );
}
