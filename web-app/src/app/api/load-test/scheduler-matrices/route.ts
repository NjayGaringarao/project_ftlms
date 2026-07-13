import { type NextRequest } from "next/server";
import { getCurrentUser } from "@/features/auth/lib/utils";
import { getSchedulerMapperMatrices } from "@/features/scheduler/lib/schedule/mapper";

// Load-test-only endpoint. get_scheduler_matrices() is normally called via a
// "use server" action (schedule-mapper.tsx's useEffect -> getSchedulerMapperMatrices()),
// and Server Actions can't be safely replayed as raw HTTP for load testing —
// their wire format (Next-Action header + React Flight body) is build-specific
// and changes on every next build/dev restart. This route wraps the exact
// same function behind a stable plain-HTTP endpoint instead, so k6 can drive
// real concurrency through the actual app layer (auth, this function, RLS)
// without going through Supabase PostgREST directly. See load-tests/README.md.
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

  const academicTermId = body.academicTermId;
  if (typeof academicTermId !== "string" || !academicTermId) {
    return Response.json({ error: "academicTermId is required" }, { status: 400 });
  }

  const asIdOrNull = (value: unknown): string | null =>
    typeof value === "string" && value ? value : null;

  try {
    const data = await getSchedulerMapperMatrices(academicTermId, {
      sectionId: asIdOrNull(body.sectionId),
      facultyId: asIdOrNull(body.facultyId),
      roomId: asIdOrNull(body.roomId),
    });
    return Response.json({ data });
  } catch (error) {
    console.error("api.load-test.scheduler-matrices ::", error);
    return Response.json({ error: "Failed to load scheduler matrices" }, { status: 500 });
  }
}
