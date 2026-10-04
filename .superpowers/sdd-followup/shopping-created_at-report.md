# Fix: Prod 500 on GET /api/shopping (shopping_items.created_at)

**Date:** 2026-02 (main)
**Status:** RESOLVED — minimal diff, no new dep, no migration.

## Root cause
`app/api/shopping/route.ts` GET queried `shopping_items` with `.order("created_at", { ascending: false })`.
The `shopping_items` table has **no `created_at` column** (confirmed by controller via
`information_schema` and a live PostgREST `42703` error: column does not exist). PostgREST
rejects the whole query, so the route returned HTTP 500 for every household.

By contrast `GET /api/tasks` works because `tasks` **does** have `created_at` (3 rows returned).

## File / line
- `app/api/shopping/route.ts:33` — removed the bad `.order("created_at", ...)`.
- GET now: `.select("id, nama, jumlah, catatan, status").eq("household_id", household_id);`
- Select columns unchanged. Auth / membership / safeNext logic untouched.
- POST / PATCH / DELETE untouched (no `created_at` referenced there).

## Diff
```
@@ -29,8 +29,7 @@ export async function GET(req: Request) {
-    .eq("household_id", household_id)
-    .order("created_at", { ascending: false });
+    .eq("household_id", household_id);
```

## Tests
Added `tests/api/shopping.test.ts` (regression):
- asserts `order` is never called with `created_at` on the GET path;
- asserts select columns remain `"id, nama, jumlah, catatan, status"` and 200 + `[]`.

Run (PowerShell, npx.cmd):
```
npx.cmd vitest run tests/api/shopping.test.ts tests/ui/shopping.test.tsx
  Test Files  2 passed (2)
       Tests  6 passed (6)

npx.cmd vitest run        # full suite
  Test Files  15 passed (15)
       Tests  31 passed (31)
```
Note: shell shows `Exited with code 1` only because npm prints its `npm notice` banner to
stderr under PowerShell; vitest itself reports all tests passed.

## Typecheck
```
npx.cmd tsc --noEmit   ->  exit 0 (clean)
```

## Build
```
npx.cmd next build     ->  exit 0
✓ Generating static pages (21/21)
ƒ /api/shopping  (Dynamic) — builds clean
```

## Scope discipline
Owned files only: `app/api/shopping/route.ts`, `tests/*` (shopping). No UI, no
`app/(main)/*`, no `components/*`, no `app/api/tasks/*` touched. `app/api/tasks` POST cause
remains unverified/owned elsewhere.
