# Agent Prompt — Step 4b: Cut Inventory over to its own database (inventory_db)

## Context

`inventory-service/prisma/schema.prisma` already models Inventory's tables
(`Inventory`, `ProductStock`, `OrderReservation`/`order_reservation_state`,
`OutboxEvent`, `ProcessedEvent`) independently from the monolith's
`schema.prisma`, but both currently point at the SAME database
(`ecommerce`), same Postgres instance/container. This step performs the
actual physical cutover: a new database, `inventory_db`, on the same
Postgres container, holding only Inventory's data — and repointing
Inventory's Prisma client at it.

This is a dev-mode, brief-pause cutover: no zero-downtime/dual-write
complexity needed. Stop writers, move the data, switch the connection
string, verify, done.

## Steps, in order

### 1. Create the new database

On the existing Postgres container (same container, no new container/service
in docker-compose), create a new database:

```sql
CREATE DATABASE inventory_db;
```

Reuse the existing `postgres` superuser/credentials already used by the
`ecommerce` database for this step — no new dedicated DB user yet. Note this
explicitly in a comment/README as a known simplification to revisit before
this ever resembles a production setup.

### 2. Stand up the `inventory` schema inside inventory_db

Inventory's Prisma schema already targets the `inventory` Postgres schema
(via `@@schema("inventory")` on every model, and `schemas = ["inventory"]` in
the datasource block). Point `inventory-service/prisma/schema.prisma`'s
`datasource db` at a NEW env var, e.g. `INVENTORY_DATABASE_URL`, pointing at
`inventory_db` instead of `ecommerce`. Do not reuse `DATABASE_URL` for this —
they must be distinct env vars from this point on, since these are now two
genuinely separate databases.

Run Inventory's existing migration history (from
`inventory-service/prisma/migrations`, already fixed up in step 3b) against
`inventory_db` to create the `inventory` schema and all its tables fresh,
empty, there. Do not hand-write this DDL — replay the real migration history
so `inventory_db` ends up with a proper Prisma migration ledger from day one.

### 3. Stop writers before moving data

Since this is dev mode, a brief pause is acceptable. Before copying data:
- Stop the running consumers (`orderCreatedConsumer`, `orderCancelledConsumer`,
  and any other process writing to the `inventory` schema in `ecommerce`).
- Confirm no pending/unpublished rows exist in the OLD
  `ecommerce.inventory.outbox_events` table before proceeding (i.e. no row
  with `published_at IS NULL`). If any exist, surface this and stop — do not
  proceed with a cutover while there are unpublished events; drain them
  first (let the existing sweep/publish path finish) and re-check.

### 4. Copy the data

For each Inventory-owned table (`Inventory`, `ProductStock`,
`order_reservation_state`, `outbox_events`, `processed_events`) in the OLD
`ecommerce.inventory` schema, copy all rows into the corresponding table in
the NEW `inventory_db.inventory` schema. Use `pg_dump`/`pg_restore` scoped to
the `inventory` schema (`pg_dump -n inventory ecommerce | psql inventory_db`),
not a hand-rolled row-by-row script — this preserves data faithfully and is
the standard tool for exactly this job.

Verify row counts match between old and new for every table before moving on.

### 5. Switch the connection string

Update whatever loads env vars for the Inventory service/consumers so
`INVENTORY_DATABASE_URL` (pointing at `inventory_db`) is what Inventory's
Prisma client (`inventoryPrisma` / the generated `inventory-prisma` client)
actually connects with. Confirm the monolith's `DATABASE_URL` (pointing at
`ecommerce`) is unchanged and still used only by non-Inventory modules.

### 6. Restart and verify

- Restart Inventory's consumers, now running against `inventory_db`.
- Re-run the full `order-reservation-state.test.ts` suite (all 7 cases:
  T1–T5 plus Race A/Race B) against the new database, and confirm all pass —
  same as the last verified run, just now hitting `inventory_db` instead of
  `ecommerce`.
- Manually verify one end-to-end flow if convenient: publish a real
  `OrderCreated`, confirm stock decrements in `inventory_db`, confirm a
  `StockReserved` row appears in `inventory_db.inventory.outbox_events` and
  gets published, confirm Orders' `inventoryStockConsumer` still picks it up
  fine (Orders' side is untouched by this step — this just confirms nothing
  broke across the boundary).

### 7. Drop the old tables — only after verification above passes

Once all of step 6 passes cleanly:
```sql
DROP SCHEMA inventory CASCADE;
```
on the OLD `ecommerce` database. This removes `ecommerce.inventory.*`
entirely. Do this only after confirming `inventory_db` is fully functional —
do not drop the old schema as part of the same pass as the copy, keep it as
a distinct, later step so there's a natural checkpoint before the
irreversible part.

## Explicit constraints

- Do not touch anything under the monolith's own `prisma/schema.prisma` or
  its migrations in this step — this is Inventory-side only.
- Do not add a new Postgres container/service to docker-compose — same
  container, new database, per the existing setup.
- Do not introduce dual-write or backfill-while-live complexity — this is a
  stop-copy-switch-verify cutover, not a zero-downtime one.
- Do not skip the row-count verification or the unpublished-outbox-rows check
  before copying — both are cheap and are exactly the kind of check that
  catches a silent data-loss bug before it's irreversible.
- Do not drop the old schema in the same step/commit as the data copy —
  dropping is its own explicit, separate action gated on verification passing.

## Done when

- `inventory_db` exists on the same Postgres container, with Inventory's full
  migration history replayed and all data copied over, row counts verified.
- Inventory's Prisma client is fully repointed at `inventory_db` via
  `INVENTORY_DATABASE_URL`; the monolith's `DATABASE_URL` is untouched.
- The full `order-reservation-state.test.ts` suite passes against
  `inventory_db`.
- `ecommerce.inventory` schema is dropped only after the above is confirmed
  working, as a distinct final step.
- A short note/README addition documents that the superuser credential reuse
  and same-container placement are known dev-mode simplifications to revisit
  later (dedicated DB user, separate container/instance).
