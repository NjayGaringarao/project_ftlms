import { type NextRequest } from "next/server";
import { getCurrentUser } from "@/features/auth/lib/utils";
import { createSessionFromOffering } from "@/features/scheduler/lib/schedule/session-actions";
import type { SessionDay, SessionType } from "@/features/shared/types/models";

// Load-test-only endpoint. Wraps createSessionFromOffering() exactly as
// schedule-mapper.tsx's handleConfirmSchedule() calls it — see
// scheduler-matrices/route.ts for why this exists instead of replaying the
// real Server Action over HTTP. Requires a pre-existing courseUtilizationId
// (load-tests/scripts/seed-schedule-race-pool.ts seeds these in the same
// "TMP-" placeholder-class state a real fresh offering would be in).
//
// Inert outside local development: 404s whenever NODE_ENV is "production",
// regardless of what else ships.
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new Response(null, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const requiredStrings = [
    "academicTermId",
    "sectionId",
    "courseUtilizationId",
    "facultyId",
    "day",
    "startTime",
    "endTime",
  ] as const;
  for (const field of requiredStrings) {
    if (typeof body[field] !== "string" || !body[field]) {
      return Response.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  try {
    const result = await createSessionFromOffering({
      academicTermId: body.academicTermId as string,
      sectionId: body.sectionId as string,
      courseUtilizationId: body.courseUtilizationId as string,
      facultyId: body.facultyId as string,
      roomId: typeof body.roomId === "string" && body.roomId ? body.roomId : null,
      day: body.day as SessionDay,
      startTime: body.startTime as string,
      endTime: body.endTime as string,
      type: (typeof body.type === "string" ? body.type : "Lecture") as SessionType,
    });

    if (result.error) {
      return Response.json({ error: result.error }, { status: 409 });
    }
    return Response.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error("api.load-test.schedule-session ::", error);
    return Response.json({ error: "Failed to create session" }, { status: 500 });
  }
}
