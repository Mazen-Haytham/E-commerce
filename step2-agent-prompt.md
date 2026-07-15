# Agent Prompt — Step 2: Add `order_reservation_state` table (schema only)

## Scope

Add a new Prisma model and migration to the `inventory` schema. **Do not** touch
`orderCreatedConsumer.ts`, `orderCancelledConsumer.ts`, `InvApiImp.ts`, or any other
consumer/service logic in this step. This is a pure schema addition — no application
code changes, no wiring.

## What to add

Add this model to `schema.prisma`, in the `inventory` schema:

```prisma
enum OrderReservationState {
  PENDING_CREATE
  RESERVED
  PRE_CANCELLED
  CANCELLED_AFTER_RESERVE
  REJECTED

  @@schema("inventory")
}

model OrderReservation {
  orderId   String                 @id @map("order_id") @db.Uuid
  state     OrderReservationState
  items     Json?
  updatedAt DateTime               @default(now()) @updatedAt @map("updated_at")

  @@map("order_reservation_state")
  @@schema("inventory")
}
```

Notes on the fields, so you don't "simplify" them away:

- `orderId` is the primary key — one row per order, not one row per event.
- `state` has no default. Every insert must explicitly choose `PENDING_CREATE`
  (order created, not yet cancelled — used only if you need an initial marker;
  most inserts will go straight to `RESERVED` or `PRE_CANCELLED`) or
  `PRE_CANCELLED` (a cancel arrived with no order-created row yet).
- `items` is nullable JSON. It is only populated when a row is created via the
  `PRE_CANCELLED` path (cancel-before-create), so that when `OrderCreated` later
  arrives, there's a record of what would have been reserved, for logging/audit
  purposes. Do not make this required.
- `updatedAt` should auto-update on every write — used for observability/debugging,
  not for logic.

## Migration

- Generate a proper Prisma migration using prisma migrate dev,
  don't hand-write raw SQL.
- Do not add a foreign key from `OrderReservation.orderId` to anything in the
  `orders` schema. This table is intentionally decoupled from Orders' own primary
  key — it exists so Inventory never has to reach into Orders' tables. No FK, no
  relation field pointing at `orders.Order`.

## Explicitly out of scope for this prompt

- No changes to `orderCreatedConsumer.ts` or `orderCancelledConsumer.ts`.
- No changes to `InvApiImp.ts` or `InventoryService`.
- No locking logic, no state-transition logic. That's the next step, separately.
- Do not remove or modify the existing raw SQL `FOR UPDATE` query into
  `orders."Order"` in `orderCreatedConsumer.ts` — it stays exactly as-is until the
  next step.

## Done when

- `schema.prisma` has the new enum and model above, correctly scoped to the
  `inventory` schema.
- A migration file exists and applies cleanly against the current dev database.
- No other file in the repo is touched.
- `prisma generate` runs clean and the new model/enum are available on the
  generated client.
