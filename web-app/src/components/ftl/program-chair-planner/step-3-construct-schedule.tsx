import { Edit, Plus, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FTLClass,
  FTLRoom,
  FTLScheduleBundle,
  FTLSession,
} from "@/lib/ftl/types";
import { DAY_OPTIONS } from "./constants";
import { SessionDraft, SessionTableRow } from "./types";
import { dayLabel, toDisplayTime } from "./utils";

type Step3ConstructScheduleProps = {
  isLoadingSchedule: boolean;
  selectedFacultyId: string | null;
  selectedTermId: string | null;
  isSaving: boolean;
  scheduleBundle: FTLScheduleBundle;
  classDeliveryOptions: {
    class_delivery_id: string;
    block_ids: string[];
    label: string;
    remaining: number;
  }[];
  newSessionDraft: SessionDraft;
  setNewSessionDraft: React.Dispatch<React.SetStateAction<SessionDraft>>;
  rooms: FTLRoom[];
  isAddDisabled: boolean;
  addDisabledReason: string | null;
  sessionTableRows: SessionTableRow[];
  classByIdMap: Map<string, FTLClass>;
  onCreateSchedule: () => Promise<void>;
  onSeedNewSessionDraft: (classDeliveryId: string) => void;
  onAddSessionRow: () => Promise<void>;
  onOpenEditSessionDialog: (
    item: FTLClass,
    session: FTLSession,
  ) => Promise<void> | void;
  onDeleteSession: (sessionId: string) => Promise<void> | void;
};

export const Step3ConstructSchedule = ({
  isLoadingSchedule,
  selectedFacultyId,
  selectedTermId,
  isSaving,
  scheduleBundle,
  classDeliveryOptions,
  newSessionDraft,
  setNewSessionDraft,
  rooms,
  isAddDisabled,
  addDisabledReason,
  sessionTableRows,
  classByIdMap,
  onCreateSchedule,
  onSeedNewSessionDraft,
  onAddSessionRow,
  onOpenEditSessionDialog,
  onDeleteSession,
}: Step3ConstructScheduleProps) => {
  return (
    <Card className="flex-1 overflow-hidden flex-col gap-0">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              Step 3: Construct Schedule
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="min-h-0 overflow-y-auto space-y-3">
        {isLoadingSchedule ? (
          <p className="text-sm text-foreground/70">Loading schedule...</p>
        ) : null}

        {!isLoadingSchedule && selectedFacultyId && !scheduleBundle.schedule ? (
          <div className="rounded-md border border-dashed p-4">
            <p className="text-sm text-foreground/70 mb-3">
              No schedule yet for this faculty and term.
            </p>
            <Button
              size="sm"
              onClick={() => void onCreateSchedule()}
              disabled={!selectedTermId || isSaving}
            >
              Create Schedule
            </Button>
          </div>
        ) : null}

        {scheduleBundle.schedule ? (
          <div className="space-y-3">
            {scheduleBundle.classes.length === 0 ? (
              <p className="rounded-md border border-dashed px-3 py-4 text-sm text-foreground/70">
                No classes yet. Add at least one class to begin scheduling
                sessions.
              </p>
            ) : (
              <div className="space-y-2 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-foreground/70">
                      <th className="px-1.5 py-1.5 min-w-28">Class Course</th>
                      <th className="px-1.5 py-1.5 min-w-40">Class Block(s)</th>
                      <th className="px-1.5 py-1.5">Day</th>
                      <th className="px-1.5 py-1.5">Start</th>
                      <th className="px-1.5 py-1.5">End</th>
                      <th className="px-1.5 py-1.5 min-w-28">Room</th>
                      <th className="px-1.5 py-1.5 text-left min-w-20">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b bg-muted/20 align-center">
                      <td className="px-1.5 py-1.5" colSpan={2}>
                        <select
                          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                          value={newSessionDraft.class_delivery_id}
                          onChange={(event) =>
                            onSeedNewSessionDraft(event.target.value)
                          }
                        >
                          <option value="">Select Class</option>
                          {classDeliveryOptions.map((item) => (
                            <option
                              key={item.class_delivery_id}
                              value={item.class_delivery_id}
                            >
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-1.5 py-1.5">
                        <select
                          className="w-20 rounded-md border bg-background px-2 py-1.5 text-sm"
                          value={newSessionDraft.day}
                          onChange={(event) =>
                            setNewSessionDraft((prev) => ({
                              ...prev,
                              day: event.target.value as SessionDraft["day"],
                            }))
                          }
                        >
                          {DAY_OPTIONS.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-1.5 py-1.5">
                        <Input
                          type="time"
                          value={newSessionDraft.start_time}
                          onChange={(event) =>
                            setNewSessionDraft((prev) => ({
                              ...prev,
                              start_time: event.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="px-1.5 py-1.5">
                        <Input
                          type="time"
                          value={newSessionDraft.end_time}
                          onChange={(event) =>
                            setNewSessionDraft((prev) => ({
                              ...prev,
                              end_time: event.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="px-1.5 py-1.5">
                        <select
                          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                          value={newSessionDraft.room_id}
                          onChange={(event) =>
                            setNewSessionDraft((prev) => ({
                              ...prev,
                              room_id: event.target.value,
                            }))
                          }
                        >
                          <option value="">Select room</option>
                          {rooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.code} {room.name ? `- ${room.name}` : ""}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-1.5 py-1.5 text-right">
                        <span
                          className="inline-flex w-full"
                          title={isAddDisabled ? addDisabledReason! : undefined}
                        >
                          <Button
                            size="sm"
                            onClick={() => void onAddSessionRow()}
                            disabled={isAddDisabled}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 text-background" />
                            Insert
                          </Button>
                        </span>
                      </td>
                    </tr>

                    {sessionTableRows.map((row) => {
                      const ownerClass = classByIdMap.get(
                        row.class_delivery_id,
                      );

                      return (
                        <tr key={row.row_id} className="border-b align-center">
                          <td className="px-1.5 py-1.5 font-medium">
                            {row.course_label}
                          </td>
                          <td className="px-1.5 py-1.5 text-xs text-foreground/70">
                            {row.major_label} | {row.block_label}
                          </td>
                          {row.has_session ? (
                            <>
                              <td className="px-1.5 py-1.5">
                                {row.session ? dayLabel(row.session.day) : "—"}
                              </td>
                              <td className="px-1.5 py-1.5">
                                {row.session
                                  ? toDisplayTime(row.session.start_time)
                                  : "—"}
                              </td>
                              <td className="px-1.5 py-1.5">
                                {row.session
                                  ? toDisplayTime(row.session.end_time)
                                  : "—"}
                              </td>
                              <td className="px-1.5 py-1.5 text-xs">
                                {row.session
                                  ? `${row.session.room_code ?? "Unknown"}${row.session.room_name ? ` - ${row.session.room_name}` : ""}`
                                  : "—"}
                              </td>
                            </>
                          ) : (
                            <td
                              colSpan={4}
                              className="px-1.5 py-1.5 text-xs text-foreground/70"
                            >
                              {row.remaining_hours > 0 ? (
                                <span>
                                  {`${row.remaining_hours.toFixed(2)} hours remaining to be scheduled`}
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                  Fully Scheduled
                                </span>
                              )}
                            </td>
                          )}
                          <td className="px-1.5 py-1.5">
                            <div className="flex items-center gap-1.5 justify-end">
                              {!row.has_session ? (
                                <span
                                  className="inline-flex"
                                  title={
                                    row.remaining_hours <= 0
                                      ? "Class course is fully scheduled."
                                      : undefined
                                  }
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    title="Stage this class"
                                    onClick={() =>
                                      onSeedNewSessionDraft(
                                        row.class_delivery_id,
                                      )
                                    }
                                    disabled={row.remaining_hours <= 0}
                                  >
                                    <PlusCircle className="h-4 w-4" />
                                  </Button>
                                </span>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    title="Modify this schedule"
                                    onClick={() => {
                                      if (ownerClass && row.session) {
                                        void onOpenEditSessionDialog(
                                          ownerClass,
                                          row.session,
                                        );
                                      }
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    title="Delete this schedule"
                                    onClick={() => {
                                      if (row.session) {
                                        void onDeleteSession(row.session.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
