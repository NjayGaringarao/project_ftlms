# Admin Page Regression Checklist

Use this checklist after refactors touching `src/lib/admin/*`, admin pages, or shared form components.

## Preconditions
- Log in as an `Admin` user.
- Open browser devtools network tab to spot failed requests.
- Start from a clean test dataset (or use clearly prefixed test records like `ZZ-REG-*`).

## Global Smoke
- [ ] Admin-only routes are accessible and non-admin routes are blocked.
- [ ] Top navigation links open the correct page for each admin module.
- [ ] Successful create/update/delete shows refreshed list/detail without manual hard reload.
- [ ] Validation errors are shown for required fields and invalid numeric/date input.

## Campuses (`/campuses`)
- [ ] List page loads existing campuses.
- [ ] Create campus works with `code`, `name`, optional `address`.
- [ ] Duplicate campus create shows a readable duplicate error.
- [ ] Edit campus updates values and returns refreshed detail/list.
- [ ] Delete campus removes record and list refreshes.

## Campus Program Offerings (`/campuses/[id]/program-offerings`)
- [ ] Create program offering (campus + program) succeeds.
- [ ] Duplicate create for same campus+program is blocked with readable error.
- [ ] Edit program offering updates association correctly.
- [ ] Delete program offering removes it and refreshes dependent lists.

## Campus Rooms (`/campuses/[id]/rooms`)
- [ ] Create room validates required `campus`, `code`; optional `name`, `capacity`.
- [ ] Capacity rejects negative and non-integer values.
- [ ] Edit room persists updates.
- [ ] Delete room with linked sessions/designations is blocked with dependency message.
- [ ] Delete room without dependencies succeeds and refreshes list/detail.

## Colleges (`/colleges`)
- [ ] List page loads existing colleges.
- [ ] Create college works with `code`, `name`, optional `description`.
- [ ] Duplicate code/name shows readable conflict message.
- [ ] Edit college persists changes.
- [ ] Delete college succeeds when not blocked by DB constraints.

## College Programs (`/colleges/[id]/programs`)
- [ ] Create program validates `college`, `code`, `name`.
- [ ] Duplicate program code conflict is handled.
- [ ] Edit program persists changes.
- [ ] Delete program refreshes related pages (program list, majors, offerings).

## Program Majors (via program detail flows)
- [ ] Create major validates `program`, `code`, `name`.
- [ ] Duplicate code-in-program conflict is handled.
- [ ] Edit major persists changes.
- [ ] Delete major refreshes program/major dependent pages.

## Major Offerings (via campus program-offering detail flows)
- [ ] Create major offering validates `program_offering` + `major`.
- [ ] Duplicate major offering conflict is handled.
- [ ] Edit major offering persists changes.
- [ ] Delete major offering refreshes dependent pages.

## Courses (`/courses`)
- [ ] Create course validates `code`, `title`.
- [ ] `lecture_unit` and `laboratory_unit` reject negative values.
- [ ] Duplicate course code conflict is handled.
- [ ] Edit course persists values.
- [ ] Delete course removes record and refreshes list.

## Academic Ranks (`/academic-ranks`)
- [ ] Create rank validates `code`, `title`.
- [ ] Duplicate code/title conflict is handled with clear message.
- [ ] Edit rank persists changes.
- [ ] Delete rank removes record and refreshes list.

## Academic Years and Terms (`/academic-years`)
- [ ] Create academic year validates `start_year`, `end_year`, and end >= start.
- [ ] Duplicate academic year conflict is handled.
- [ ] Edit academic year persists changes.
- [ ] Delete academic year is blocked when terms still exist.
- [ ] Create term validates `name`, `start`, `end`, and start <= end.
- [ ] Duplicate term-in-year conflict is handled.
- [ ] Edit term persists changes.
- [ ] Delete term is blocked when blocks exist for that term.

## Blocks (`/blocks`)
- [ ] Term-scoped blocks list loads correctly.
- [ ] Create block validates `major_offering`, `academic_term`, positive `year_level`, non-empty `section`, and non-negative `student_count`.
- [ ] Duplicate block conflict (same major offering + year + section) is handled.
- [ ] Edit block persists changes and refreshes both old/new term lists if term changed.
- [ ] Delete block removes record and refreshes term list.

## Users (`/users`)
- [ ] List/search/filter still works.
- [ ] Create user flow still completes (account + profile basics).
- [ ] Edit user flow still updates expected fields.
- [ ] Role/designation changes reflect in protected-route behavior on next navigation.

## Cross-Module Consistency
- [ ] New records appear in dependent selectors (campus, college, program, term, etc.).
- [ ] Deleted records no longer appear in dependent selectors.
- [ ] No stale data after mutation when navigating back to list/detail pages.
