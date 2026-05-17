# FTL Evaluation Regression Checklist

Use this checklist after changes in:
- `src/lib/proposal/*`
- `src/components/ftl-evaluation/*`
- `src/app/(protected)/ftl-evaluation/*`

## Preconditions
- Log in with test users that cover these roles:
  - `Campus Director`
  - `Director for Instruction`
  - `Vice President for Academic Affairs`
  - `Admin`
- Have at least one academic term with:
  - multiple faculty in a campus,
  - mixed proposal states (`ACTIVE`, `APPROVED`, `REJECTED`, `INVALIDATED`, and no proposal),
  - at least one campus with an existing campus proposal and one without.
- Keep browser devtools open (network + console).

## Routing And Access Control
- [ ] `/ftl-evaluation` redirects to `/ftl-evaluation/[academic_term_id]` when terms exist.
- [ ] `/ftl-evaluation/[academic_term_id]` redirects by role:
  - Campus Director/Admin -> `/campus-load/faculty-load`
  - DI/VPAA -> `/university-load`
- [ ] Campus Director can access `/campus-load/*` and is redirected away from `/university-load/*`.
- [ ] DI/VPAA can access `/university-load/*` and is redirected away from `/campus-load/*`.
- [ ] Admin can access both campus-load and university-load routes.

## Header And Term Switcher
- [ ] `/campus-load/*` shows localized header with tabs:
  - `Faculty Load`
  - `Campus Proposal Control`
- [ ] `/university-load/*` shows localized `University Load` header (no extra tabs).
- [ ] Term switcher keeps route shape while replacing only the term segment.
- [ ] No duplicate top-bar/header rendering appears.

## Campus Load - Faculty List
- [ ] Faculty list loads campus-scoped rows for Campus Director; Admin sees full list.
- [ ] Search filters rows correctly.
- [ ] Status chips render and filter correctly:
  - `Pending`
  - `Approved`
  - `Rejected`
  - `Invalidated`
  - `No proposal`
- [ ] Chip counts are search-aware and update as query changes.
- [ ] Long-press on eligible row starts selection mode.
- [ ] Selection mode behavior:
  - `Select all` selects only currently visible eligible rows.
  - `Cancel selection` clears selection.
  - selection mode auto-exits when selected count becomes 0.
- [ ] Bulk evaluation flow:
  - `Evaluate multiple` opens dialog.
  - bulk approve succeeds.
  - bulk reject opens comment dialog and succeeds.
  - stale/ineligible selections are safely skipped without breaking valid ones.

## Campus Load - Faculty Detail Workspace
- [ ] Detail layout renders correctly:
  - schedule area
  - proposal summary
  - `Faculty Load Approval` panel
- [ ] Faculty approval states render correctly:
  - `PENDING`, `APPROVED`, `REJECTED`, `INVALIDATED`
- [ ] Campus Director can approve pending proposal.
- [ ] Campus Director can reject pending proposal via reject-comment dialog.
- [ ] Rejected/invalidated proposals show expected messaging/reason.
- [ ] No cross-route jump to `/faculty-teaching-load/*` is present in evaluation workspace.

## Campus Proposal Control (Campus Director)
- [ ] Insights panel renders with campus+term subtitle.
- [ ] `Approved Proposals` / `All Proposals` toggle updates charts, counts, and table.
- [ ] Load distribution thresholds are correct:
  - `< 21.00` underload
  - `21.00 - 24.00` normal
  - `> 24.00` overload
- [ ] ETL vs ATL chart and individual faculty table reflect the selected toggle scope.
- [ ] Campus load proposal status summary:
  - no-proposal state renders inline create action
  - create/recreate button enable/disable follows readiness rules
  - readiness helper text is shown when blocked

## University Load (DI/VPAA)
- [ ] Campus list search works and selecting a campus opens `/university-load/[campus_id]`.
- [ ] Workspace reuses the same insights/data sections as campus proposal control.
- [ ] DI/VPAA ladder rendering is correct:
  - no campus proposal -> DI/VPAA cards hidden
  - invalidated campus proposal -> DI/VPAA cards hidden
  - active campus proposal with no DI decision -> DI shown, VPAA hidden
  - DI approved -> VPAA shown
  - DI rejected -> VPAA hidden
- [ ] DI can approve/reject only when DI step is actionable.
- [ ] VPAA can approve/reject only after DI approval and when VPAA step is actionable.
- [ ] Reject action opens comment dialog and submit works with optional comment.

## Invalidation And Workflow Integrity
- [ ] Editing faculty load/schedule invalidates affected individual proposal.
- [ ] Individual proposal invalidation/rejection during campus review invalidates current campus proposal for the same campus+term.
- [ ] After invalidation, campus proposal status reflects `INVALIDATED` and ladder cards are hidden.
- [ ] Campus Director can selectively invalidate/recreate individual proposals and recreate campus proposal.

## Revalidation And Freshness
- [ ] After individual approval/rejection, list chips and detail status refresh without hard reload.
- [ ] After bulk evaluation, selection mode exits and statuses refresh.
- [ ] After campus proposal create/recreate/evaluate actions, both campus-load and university-load views reflect updated data.
- [ ] Returning between faculty list/detail and campus/university workspaces shows current state (no stale UI).

## Cross-Feature Checks
- [ ] FTL Evaluation remains read-only for schedule management (no manage-schedule controls).
- [ ] Changes made in `/faculty-teaching-load` and `/scheduler` are reflected in FTL evaluation summaries/insights after refresh.
