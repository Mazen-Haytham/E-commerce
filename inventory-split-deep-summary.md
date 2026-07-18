# Splitting Inventory into a Microservice: Full Design Reasoning and Progress

This document is a deep-dive summary of the reasoning and decisions made so far
while planning the extraction of Inventory into its own service with its own
database, in the `Mazen-Haytham/E-commerce` project.

---

## Part 1 — The core problem: what a database split actually breaks

The trigger for all of this was a simple observation: `orderCreatedConsumer.ts`
takes a Postgres row lock directly on Orders' table:

```sql
SELECT status::text FROM "orders"."Order" WHERE id = ... FOR UPDATE
```

This works today because Orders and Inventory share one Postgres database — the
lock is real, enforced by the same lock manager, inside the same transaction.

The moment Inventory gets its **own** database, this becomes not just architecturally
ugly but *literally impossible*. There is no way to take a row lock across two
separate databases, even on the same Postgres server. This is a hard technical
wall, not a style problem — and it forced a rethink of what "consistency" even
means once a shared transaction boundary is gone.

### The mental model that resolves it

The instinct is to look for a distributed-locking replacement — 2PC, a
distributed lock manager, a synchronous "ask Orders for its current status" RPC.
All of these are traps. The real reframe:

> Don't replace a shared lock with a distributed lock. Replace "ask another
> service for its live state" with "keep a local projection of just enough of
> that state, built purely from events, and lock your own local copy of it."

Inventory should never query Orders' live status. It should only ever consult
what it has already learned from events it has consumed (`OrderCreated`,
`OrderCancelled`). Locking then happens on Inventory's own local row — which
works fine, because that's back to being a single-database, single-transaction
lock again.

---

## Part 2 — A second hidden coupling, found while reviewing the schema

While reviewing `schema.prisma` for the DB split, a second, previously
undiscovered cross-service dependency turned up:

```prisma
model ProductStock {
  productVariantId String
  productVariant   ProductVariant @relation(...)  // crosses into `catalog` schema
  @@schema("inventory")
}
```

`ProductStock` had a real foreign key into `ProductVariant`, which lives in the
`catalog` schema — a second service boundary being silently crossed, this time
between Inventory and Catalog rather than Inventory and Orders. Same root cause,
same fix: once Inventory is a separate database, Postgres cannot enforce a
foreign key across two databases at all — no configuration fixes this, it's a
hard limitation. The fix was to remove the relation and keep `productVariantId`
as a plain, DB-unenforced string, with validity trusted via events
(`ProductCreated`/`VariantCreated`) rather than enforced by the database.

This is the same underlying lesson as the Orders coupling, generalized: **a
foreign key or a live query across a schema boundary is really a service
boundary being ignored, and it will surface as a hard blocker the moment that
boundary becomes a real database boundary.**

---

## Part 3 — The state machine that replaces the cross-schema lock

To replace the `FOR UPDATE` on Orders' table, Inventory needs a small,
self-owned table that records, per order, what Inventory currently believes
happened — built entirely from events, never from a live query.

### The table: `order_reservation_state`

One row per `orderId`, holding a `state` enum and (only when needed) the order's
`items`, so cancel-before-create has something to act on later.

### The transition table (the actual design artifact)

| Current state    | Incoming event   | Result                                                          |
|-------------------|------------------|------------------------------------------------------------------|
| no row            | `OrderCreated`   | reserve stock, insert row as `RESERVED`                          |
| no row            | `OrderCancelled` | nothing to reserve back — insert row as `PRE_CANCELLED`, store items |
| `PRE_CANCELLED`   | `OrderCreated`   | **skip reservation entirely**, move to `CANCELLED_AFTER_RESERVE`  |
| `RESERVED`        | `OrderCancelled` | run increment-back logic, move to `CANCELLED_AFTER_RESERVE`       |
| terminal state    | anything         | no-op, log only                                                   |

The critical design decision here is **`PRE_CANCELLED` as a first-class,
storable state** — not discarding a cancel event just because no order exists
yet. This is what makes the whole thing independent of event arrival order,
which matters because RabbitMQ topic exchanges give no guarantee that
`OrderCreated` arrives before `OrderCancelled` for the same order, especially
once these are genuinely separate processes with independent retry timing.
Any implementation that implicitly assumes ordering (e.g. treating "row exists"
as a proxy for "create happened first") is a latent bug — this was called out
explicitly as something to rule out in the agent prompt for this step.

### Why this doesn't merge with `processedEvent`

`processedEvent` answers "have I seen this exact event before" (a dedup
concern). `order_reservation_state` answers "what do I currently believe
happened to this order" (a business-state concern). They're related but
deliberately kept as separate tables/checks, both running inside the same
transaction — conflating them would make either one harder to reason about
independently.

---

## Part 4 — Outbox and ProcessedEvent, revisited in depth

These two tables came up repeatedly, and it's worth having the full reasoning
in one place rather than scattered.

### `processedEvent` — idempotency on the receiving side

Messaging systems (RabbitMQ included) generally guarantee *at-least-once*
delivery, not *exactly-once*. Redeliveries are a normal, expected occurrence —
not a rare edge case. Without a guard, a consumer could process the same event
twice (e.g. decrement stock twice for one order).

The guard: before doing any work, check for an existing row keyed on
`(eventId, consumerName)`. If it exists, no-op. If not, do the work and insert
the row — **in the same transaction** as the work itself, so the guard and the
business logic succeed or fail together. `consumerName` matters because the
same event may legitimately be processed independently by multiple consumers
(e.g. Orders' consumer and Inventory's consumer both seeing a related event) —
each needs its own dedup record.

### `outboxEvent` — reliable publish on the sending side

The mirror-image problem: a service wants "commit this business change" and
"announce it via an event" to happen atomically — never one without the other.
You can't get that by committing to Postgres and then separately calling
`publish()` to RabbitMQ, because those are two unrelated systems with no shared
transaction.

The outbox pattern solves this by writing a row describing the event into the
outbox table, **in the same local transaction** as the business change. If the
transaction commits, the event-to-publish durably exists on disk; if it rolls
back, so does the outbox row. A separate step (inline attempt, or sweep) later
reads unpublished rows and actually publishes them, marking them published once
confirmed.

### Why Inventory needs its *own* outbox — not just as a consumer, but as a producer

It's tempting to think Inventory, being "downstream" of Orders, only consumes
events and therefore wouldn't need an outbox. This is wrong — Inventory
originates its own events too (`StockReserved`, `StockRejected`), which Orders
depends on to update order status. Inventory is a producer in its own right for
these, and the same atomicity problem applies: if stock gets decremented and
then the process crashes before publishing `StockReserved`, Orders never finds
out, and the order is stuck forever with no visibility into why.

The reason each service needs its **own separate** outbox table, rather than
sharing one, is that the atomicity guarantee outbox provides is fundamentally
local to a single Postgres transaction. It only works because the outbox
insert and the business-logic write commit together. Once Inventory has its
own database, "Inventory's business logic" and "a shared outbox table" would be
two different databases — reintroducing exactly the cross-database atomicity
problem outbox exists to prevent, one level removed.

### The sweep job — ownership boundary

A natural-sounding but wrong instinct: "Orders should sweep Inventory's outbox
table to catch failed `StockReserved` publishes." This recreates the same
cross-service reach-in being eliminated everywhere else (the `FOR UPDATE` into
Orders' table, the FK into Catalog's table).

The correct ownership split:
- **Inventory** owns "did my own event actually make it onto the exchange?" —
  its own sweep, over its own outbox table, retrying publishes and marking them
  published. Entirely internal to Inventory.
- **Orders** owns "once a message actually arrives at my queue, do I process it
  correctly and idempotently?" — that's `inventoryStockConsumer` plus its own
  `processedEvent` check. Orders' responsibility begins only once the message
  is on its queue; it has no visibility into, and no responsibility for, what
  happened upstream before that.

If Orders needed to inspect Inventory's database to guarantee delivery, the two
services wouldn't actually be independent — correctness would silently depend
on cross-database access, which defeats the purpose of the split.

A subtlety worth keeping in mind: the sweep itself can double-publish (crash
between "RabbitMQ confirmed" and "markPublished committed"), so it's
at-least-once, same as everything else in the system. This is exactly why
`processedEvent` dedup on the *receiving* side isn't optional — it's what makes
the sweep's own retries safe.

---

## Part 5 — Migration/practical sequencing (same Postgres server, via Docker)

Once the two hidden cross-schema dependencies were understood, the question of
*how* to physically execute the split came up. Key points:

- **Docker/container topology is the easy part.** What matters is whether
  you're creating a second **database** (`CREATE DATABASE inventory_db`) inside
  the same Postgres instance, or a second Postgres instance entirely. Same
  instance, separate database is the right middle step — it forces the real
  lesson (no cross-database joins, FKs, or transactions; separate migration
  history; separate connection string) without also taking on infra complexity
  (separate container/volume/backup story) at the same time.
- **Prisma forces the schema split.** One `schema.prisma` = one connection
  string = one database. This means two separate Prisma projects/clients are
  required, and any relation crossing into "the other database" must be
  deleted from the schema entirely, not just left unused.
- **Promoting to a separate container later should be a non-event**, if the
  database-level split was done correctly — it's a pure infra change (new
  connection string, new container, restore a dump) with no code impact.

---

## Part 6 — Progress so far, step by step

| Step | Status | What it does |
|------|--------|----------------|
| 1 | **Done** | Removed the `ProductStock → ProductVariant` FK/relation; `productVariantId` is now a plain unenforced string. |
| 2 | **Done** | Added `OrderReservation` model (`order_reservation_state` table) + `OrderReservationState` enum to the `inventory` schema. No FK back to Orders. Schema/migration only — no consumer logic touched. |
| 3 | **Prompt written**, not yet confirmed run/reviewed | Rewires `orderCreatedConsumer.ts` and `orderCancelledConsumer.ts` to lock/read/write `order_reservation_state` instead of the raw SQL into `orders."Order"`. Implements the full 5-transition table above, keeps `processedEvent` dedup untouched and separate. Highest-risk step so far — real concurrency logic. |
| 4a | **Prompt written**, not yet run | Splits `schema.prisma` into two Prisma projects (Inventory vs. the rest), still pointed at the *same* database/connection string. Includes giving Inventory its own `outbox_events`/`processed_events` tables under the `inventory` schema (no longer sharing `public`'s). Pure refactor, no infra change. |
| 4b | **Not started, deliberately held back** | The actual cutover: stand up `inventory_db` as a real second database on the same Postgres server, migrate Inventory's schema + data over, switch Inventory's Prisma client to the new connection string. Held until 4a is proven stable. |
| Later | **Not started** | Promoting `inventory_db` from "second database, same server" to a fully separate container/instance — should be a pure infra change if everything above was done correctly. |

---

## Part 7 — The throughline

Every piece of this — the lock replacement, the FK removal, the outbox
duplication, the sweep ownership boundary — is really one recurring idea
applied to different pairs of tables:

**A service should never reach into another service's database to make a
decision — synchronously or at the schema level. It should keep just enough
locally-owned, event-derived state to make that decision on its own, and treat
any place code currently reaches across a schema boundary as a service
boundary being silently ignored, waiting to become a hard blocker.**

This is also the substance behind the `OrderApi` idea from earlier in the
project's history: it's less "design a function Inventory calls" and more
"decide exactly which facts about another service's lifecycle you're allowed
to know, and guarantee they only ever arrive as events — never as a live
query or a cross-schema join."
