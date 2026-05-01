"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AdminPanel from "../admin-panel";
import FormStatusBanner from "../form-status-banner";
import { ExtendedRoom } from "@/features/shared/types/models";
import { updateRoom } from "@/features/admin/lib/actions";

type RoomEditProps = {
  room: ExtendedRoom;
  basePath?: string;
};

export const RoomEdit = ({ room, basePath = "/rooms" }: RoomEditProps) => {
  const router = useRouter();
  const [code, setCode] = useState(room.code);
  const [name, setName] = useState(room.name ?? "");
  const [capacity, setCapacity] = useState(
    room.capacity !== null ? String(room.capacity) : "",
  );
  const [savedState, setSavedState] = useState({
    code: room.code,
    name: room.name ?? "",
    capacity: room.capacity !== null ? String(room.capacity) : "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!code.trim()) return setError("Room code is required");

    const parsedCapacity = capacity.trim() ? Number(capacity) : null;
    if (
      parsedCapacity !== null &&
      (!Number.isInteger(parsedCapacity) || parsedCapacity < 0)
    ) {
      return setError("Room capacity must be a whole number zero or greater");
    }

    setIsSaving(true);
    setError("");
    setSuccess(false);

    const { error: updateError } = await updateRoom({
      id: room.id,
      campus_id: room.campus_id,
      code,
      name,
      capacity: parsedCapacity,
    });

    setIsSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    setSavedState({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      capacity: parsedCapacity !== null ? String(parsedCapacity) : "",
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <AdminPanel
      title="Edit Room"
      icon={Edit}
      onClose={() => router.push(`${basePath}/${room.id}`)}
    >
      <div className="space-y-4">
        <FormStatusBanner
          variant="compact"
          success={success ? { title: "Room updated successfully" } : undefined}
          error={error}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <h3 className="font-semibold">Room Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs" htmlFor="code">
                Room Code *
              </Label>
              <Input
                id="code"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setError("");
                }}
                onBlur={(event) =>
                  setCode(event.target.value.trim().toUpperCase())
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="name">
                Room Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                onBlur={(event) => setName(event.target.value.trim())}
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="capacity">
                Capacity
              </Label>
              <Input
                id="capacity"
                type="number"
                min="0"
                value={capacity}
                onChange={(event) => {
                  setCapacity(event.target.value);
                  setError("");
                }}
                className="mt-1"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setCode(savedState.code);
                setName(savedState.name);
                setCapacity(savedState.capacity);
                setError("");
                setSuccess(false);
              }}
              disabled={isSaving}
            >
              Reset
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </AdminPanel>
  );
};
