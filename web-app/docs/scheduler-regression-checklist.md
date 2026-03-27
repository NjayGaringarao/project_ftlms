# Scheduler Regression Checklist

Use this checklist after changes in:
- `src/lib/schedule/*`
- `src/components/scheduler/*`
- scheduler routes under `src/app/(protected)/scheduler/*`

## Preconditions
- Log in as an allowed scheduler role: `Admin`, `Program Chairperson`, or `College Dean`.
- Have at least one academic term, one block, and at least one course offering/class to schedule.
- Keep browser devtools open (network + console) for failed requests/runtime warnings.

## Routing And Term Switching
- [ ] `/scheduler` redirects to `/scheduler/[academic_term_id]` when terms exist.
- [ ] `/scheduler` shows empty-state message when no terms exist.
- [ ] Invalid term id under `/scheduler/[academic_term_id]` redirects to first available term.
- [ ] Term switcher changes only the term segment and keeps scheduler page functional.
- [ ] No duplicate header/term-switcher rendering.

## Access Control
- [ ] Allowed roles can open scheduler pages.
- [ ] Disallowed roles are blocked/redirected according to app guard rules.

## Context Selection And URL Sync
- [ ] Selecting `Faculty`, `Block`, and `Room` updates query params (`facultyId`, `blockId`, `roomId`).
- [ ] Clearing each context removes only its own query param.
- [ ] Selecting course offering sets `courseUtilizationId` in URL.
- [ ] Reloading the page preserves selected contexts from query params.
- [ ] Deep link with prefilled params opens expected context (including links coming from FTL “Manage Schedule”).

## Matrix Rendering
- [ ] Block matrix loads sessions for selected block.
- [ ] Faculty matrix loads sessions for selected faculty.
- [ ] Room matrix loads sessions for selected room.
- [ ] Loading states appear and clear properly; no stale matrix after refresh.
- [ ] Overlapping sessions render in the same slot without UI breakage.

## Schedule Creation Flow
- [ ] Selecting a course offering opens scheduling flow and right pane details.
- [ ] Drag/select range opens confirm dialog.
- [ ] Creating `Lecture` session succeeds and appears in matrix + right pane list.
- [ ] Creating `Laboratory` session succeeds and appears in matrix + right pane list.
- [ ] Canceling confirm dialog does not create any session.

## Conflict Rules
- [ ] Prevent create when end time <= start time.
- [ ] Prevent create when class already has overlapping session.
- [ ] Prevent create when faculty has overlapping session.
- [ ] Prevent create when block has overlapping session.
- [ ] Prevent create when room is occupied.
- [ ] Conflict message contains reason and time window.

## Right Pane Actions
- [ ] Class sessions list loads for selected class and auto-selects a valid session.
- [ ] `Update Room` action updates room and refreshes matrix.
- [ ] `Replace Faculty` updates faculty only when no conflicts exist.
- [ ] `Replace Faculty` conflict is shown with time window.
- [ ] `Delete Session` removes session and updates selection safely.
- [ ] Deleting last session of a class clears selection state cleanly.

## Data Integrity (Behavioral)
- [ ] Session creation inserts both `session` and `session_class` rows.
- [ ] Create-from-offering creates/links class when missing and assigns `user_class` when needed.
- [ ] Deleting a session unlinks faculty from class only when class has zero sessions left.
- [ ] No duplicate `user_class` assignment is introduced during create-from-offering.

## Revalidation And Freshness
- [ ] After create/update/delete/replace actions, `/scheduler/[term]` reflects new data without hard reload.
- [ ] Returning from other routes back to scheduler shows updated schedule state.

## Cross-Feature Checks
- [ ] FTL “Manage Schedule” per-row action lands on scheduler with correct context.
- [ ] Scheduler edits are reflected in faculty schedule views (`/me` and FTL pages using schedule read models).

