# Agent Prompt — Step 3b: Fix insert-race in order_reservation_state

## Context / bug being fixed

`handleOrderCreatedTx` and `handleOrderCancelledTx` currently do:

  1. `SELECT ... FOR UPDATE` on `inventory.order_reservation_state` for the order
  2. branch on what was found (including "no row")
  3. `INSERT` a new row if none existed

`FOR UPDATE` locks nothing when no row exists yet. If `OrderCreated` and
`OrderCancelled` for the same order are processed concurrently (two consumer
instances, or overlapping handlers), both can read "no row" at the same time,
and both attempt to `create()` the first row. One `INSERT` wins, the other hits
a unique-constraint violation on `order_id` (the primary key).

Today that violation is NOT handled as a valid outcome — it's caught by the
generic catch block and treated as a hard failure:
- In `orderCreatedConsumer`, this incorrectly triggers `recordStockRejectedEvent`
  and publishes `StockRejected`, even when the stock decrement it just ran
  actually succeeded and only the bookkeeping insert lost the race.
- In `orderCancelledConsumer`, it gets re-thrown for a broker retry — not
  incorrect, but an avoidable failure/retry cycle for a case that's actually
  expected and handleable.

## Fix

Replace the read-then-maybe-insert pattern with an atomic
"insert-first, detect conflict" pattern, in both `handleOrderCreatedTx` and
`handleOrderCancelledTx`.

### `handleOrderCreatedTx` (orderCreatedConsumer.ts)

Before doing anything else state-related:

1. Attempt:
   ```sql
   INSERT INTO inventory.order_reservation_state (order_id, state)
   VALUES ($orderId, 'RESERVED')
   ON CONFLICT (order_id) DO NOTHING
   RETURNING order_id
   ```
   (via `tx.$queryRaw`, matching the existing raw-query style in this file)

2. If this INSERT returned a row (i.e. it won) → this is the T1 happy path.
   Proceed to run `deps.inventoryApi.decrementStockForOrderItems(...)` exactly
   as today, then continue with the outbox insert / processedEvent write /
   return value, unchanged. Do NOT re-run the SELECT ... FOR UPDATE in this
   branch — you already know you're first and hold the row.

3. If this INSERT returned no row (i.e. conflict — someone else already has a
   row for this order), THEN fall back to the existing lock-and-read step:
   `SELECT state, items FROM inventory.order_reservation_state WHERE order_id =
   ... FOR UPDATE`, and branch exactly as today across T3 (`PRE_CANCELLED`),
   T5 (terminal states), and the "unexpected state" fallback. Do not run the
   stock decrement in any of these branches — only the winning-insert branch
   in step 2 above may call `decrementStockForOrderItems`.

Do not remove or weaken the existing dedup check (`processedEvent`) — it stays
exactly where it is, running first, before any of the above.

### `handleOrderCancelledTx` (orderCancelledConsumer.ts)

Same restructuring, mirrored:

1. Attempt:
   ```sql
   INSERT INTO inventory.order_reservation_state (order_id, state, items)
   VALUES ($orderId, 'PRE_CANCELLED', $items)
   ON CONFLICT (order_id) DO NOTHING
   RETURNING order_id
   ```

2. If this INSERT returned a row → T2 happy path (cancel arrived first). Done —
   do not run increment logic, do not do a further SELECT/lock. Continue to the
   processedEvent write and return, unchanged from current behavior.

3. If this INSERT returned no row (conflict — a row already exists) → fall back
   to `SELECT ... FOR UPDATE` and branch exactly as today across T4
   (`RESERVED` → run increment-back, update to `CANCELLED_AFTER_RESERVE`), T5
   (terminal → no-op), and the unexpected-state fallback.

## Explicit constraints

- Do not change the meaning of any existing state or transition — T1 through T5
  behave identically from the caller's/Orders' perspective. This step only
  changes *how the row-ownership race is resolved*, not what any state means.
- The `ON CONFLICT DO NOTHING RETURNING` insert and any fallback `SELECT ...
  FOR UPDATE` must happen inside the same transaction (`tx`) as everything
  else in the handler — no separate connection, no gap.
- Do not treat a conflict (INSERT returning no row) as an error anywhere. It is
  an expected, valid outcome of the state machine, not an exception. Nothing
  should be logged as a failure or routed to `recordStockRejectedEvent` /
  rethrown-for-retry purely because of a conflict on this insert.
- Do not change `recordStockRejectedEvent`, the outer `try/catch` in either
  `startOrderCreatedConsumer`/`startOrderCancelledConsumer`, or the
  `processedEvent` dedup logic — those stay as they are. This fix is scoped to
  the internals of `handleOrderCreatedTx` and `handleOrderCancelledTx` only.

## Also fix: orphaned migration

The `add_order_reservation_state` migration currently lives under
`./prisma/migrations/20260715063638_add_order_reservation_state/`, which is the
OLD monolith migrations folder — not `inventory-service/prisma/migrations/`,
where the `OrderReservation` model now actually lives (in
`inventory-service/prisma/schema.prisma`).

- Move this migration (or regenerate it via `prisma migrate dev` against the
  `inventory-service/prisma/schema.prisma` project) so it is tracked under
  `inventory-service/prisma/migrations/`.
- Remove the orphaned copy from `./prisma/migrations/` once confirmed the
  table/enum are properly tracked under the Inventory project's own migration
  history.
- Do not touch any other migration in either directory as part of this cleanup.

## Done when

- Both consumers use the insert-first, detect-conflict pattern described above.
- A test exists simulating the concurrent-race scenario for both orderings
  (OrderCreated racing OrderCancelled, and OrderCancelled racing OrderCreated)
  and asserts: no unhandled error/rejection is produced purely due to the race,
  the correct final state (`CANCELLED_AFTER_RESERVE`) is reached in both
  orderings, and stock is only decremented when the create-side genuinely wins
  the race (never decremented-then-rolled-back-then-still-counted, and never
  decremented when cancel wins).
- `add_order_reservation_state` migration is tracked under
  `inventory-service/prisma/migrations/`, and no longer exists under the old
  `./prisma/migrations/` path.
