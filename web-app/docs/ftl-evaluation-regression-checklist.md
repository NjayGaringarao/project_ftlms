# Campus College Load Regression Checklist

Use this checklist after changes in:
- `src/app/(protected)/campus-college-load/*`
- `src/features/campus-college-load/*`
- `supabase/migrations/*_proposal_*`
- `supabase/migrations/*_load_evaluations.sql`

## Preconditions
- Log in with test users covering Program Chairperson, Campus Director, Director for Instruction, and VPAA.
- Have one academic term with classes assigned to sections whose program offerings resolve to at least one campus+college scope.

## Access And Routing
- [ ] Program Chairperson can see `/campus-college-load`.
- [ ] Campus Director can see `/campus-college-load`.
- [ ] DI and VPAA can see `/campus-college-load`.
- [ ] Admin does not see or access `/campus-college-load`.
- [ ] `/faculty-teaching-load` and `/ftl-evaluation` are not present in navigation and are not generated routes.

## Program Chair Workflow
- [ ] Program Chairperson sees campus+college scopes derived from their program offering designations.
- [ ] Submitting a load creates one `campus_college_load` per campus+college+term.
- [ ] Submitted revision stores a frozen snapshot.
- [ ] Snapshot includes classes by section program offering campus+college, not by faculty home college alone.
- [ ] A returned load can be resubmitted by any Program Chairperson in the same campus+college.

## Evaluation Ladder
- [ ] Campus Director can approve/return only loads from their campus.
- [ ] DI can act only after Campus Director approval.
- [ ] VPAA can act only after DI approval.
- [ ] VPAA approval sets the load to `APPROVED` and step `COMPLETED`.
- [ ] Return requires a comment.
- [ ] Optional return PDF uploads and appears as a downloadable signed link.

## Freshness
- [ ] Editing schedules after submission does not change the frozen snapshot.
- [ ] Resubmitting after return creates a new revision with updated snapshot contents.
- [ ] Ladder history shows decisions for the current revision in order.
