# Order Inventory Saga Step 2

This note documents the latest changes that move stock decrementing out of
`OrderService.createOrder` and into an async Orders/Inventory saga using
RabbitMQ, `outbox_events`, and `processed_events`.

## Goal

Orders should no longer synchronously decrement Inventory stock when an order is
created. Instead:

1. Orders creates a `pending` order.
2. Orders writes an `OrderCreated` event to `outbox_events`.
3. Orders best-effort publishes `OrderCreated`.
4. Inventory consumes `OrderCreated`.
5. Inventory attempts to decrement stock in its own transaction.
6. Inventory publishes either `StockReserved` or `StockRejected`.
7. Orders consumes that result event and updates the order status.

## Status Values

The order status flow now uses:

- `pending`
- `confirmed`
- `stock_rejected`
- `cancelled`

`pending`, `confirmed`, and `stock_rejected` are present in the Prisma
`OrderStatus` enum and in the order status constants.

## Order Creation Flow

File:

- `src/Modules/Orders/Service/OrderService.ts`

`createOrder` still validates:

- user exists
- product variants exist
- item quantities and prices are valid
- advisory stock is currently available

There are two stock checks:

- Pre-transaction check using `prisma`
- In-transaction check using `tx`

These checks are advisory. They reduce obvious failures, but final stock
reservation happens asynchronously in Inventory.

Inside the order transaction:

1. The order is created with status `pending`.
2. An `OrderCreated` outbox row is inserted.
3. No stock decrement happens.

After commit:

1. Orders best-effort publishes `OrderCreated`.
2. If publish fails, the outbox row remains for later relay.

## Inventory OrderCreated Consumer

File:

- `src/Modules/Inventory/consumers/orderCreatedConsumer.ts`

Queue:

- `inventory.order_events`

Routing key:

- `order.created`

The consumer:

1. Ignores non-`OrderCreated` events.
2. Checks `processed_events` by `eventId` and consumer name.
3. Skips duplicates without side effects.
4. Opens a transaction for new events.
5. Calls the existing Inventory API:

```ts
await inventoryApi.decrementStockForOrderItems(payload.items, tx);
```

If stock is sufficient:

1. Stock decrement commits.
2. A `StockReserved` event is inserted into `outbox_events` in the same
   transaction.
3. The original `OrderCreated` event is marked in `processed_events`.
4. After commit, Inventory best-effort publishes `StockReserved`.

If stock is insufficient:

1. The decrement transaction rolls back.
2. A separate transaction inserts a `StockRejected` event into `outbox_events`.
3. The original `OrderCreated` event is marked in `processed_events`.
4. After commit, Inventory best-effort publishes `StockRejected`.

This separation matters because the rejected outbox row must not be written
inside the rolled-back decrement transaction.

## Inventory Stock Events

File:

- `src/Modules/Inventory/events/inventoryStockEvent.ts`

Events:

- `StockReserved`
- `StockRejected`

`StockReserved` payload:

```ts
{
  orderId: string;
  originalEventId: string;
}
```

`StockRejected` payload:

```ts
{
  orderId: string;
  reason: string;
}
```

Routing keys:

- `inventory.stock.reserved`
- `inventory.stock.rejected`

## Orders Inventory Result Consumer

File:

- `src/Modules/Orders/consumers/inventoryStockConsumer.ts`

Queue:

- `orders.inventory_events`

Routing keys:

- `inventory.stock.reserved`
- `inventory.stock.rejected`

The consumer:

1. Ignores unrelated events.
2. Dedupes by `eventId` in `processed_events`.
3. On `StockReserved`, updates the order to `confirmed`.
4. On `StockRejected`, logs the reason and updates the order to
   `stock_rejected`.
5. Marks the inventory event as processed.

Order status updates use the existing order repository path rather than raw
queries.

## Pending Order Sweep

File:

- `src/Modules/Orders/jobs/pendingOrderSweep.ts`

The sweep handles orders that remain `pending` because Inventory did not
produce a result event.

Configuration:

- `PENDING_ORDER_SWEEP_INTERVAL_MS`
  - default: `60000`
- `PENDING_ORDER_TIMEOUT_MS`
  - default: `300000`

Behavior:

1. Finds orders with status `pending` older than the timeout.
2. Updates each order to `stock_rejected`.
3. Logs a timeout-specific message:

```txt
[PendingOrderSweep] pending order rejected due to stock timeout
```

This log message is intentionally different from the event-based
`StockRejected` log.

## Outbox and Processed Events

The implementation reuses the existing generic shared tables:

- `outbox_events`
- `processed_events`

This is acceptable because the schema is already generic:

- `aggregateType`
- `aggregateId`
- `eventType`
- `payload`
- `consumerName`

Inventory events use `aggregateType: "InventoryStock"`.

## RabbitMQ Topology

File:

- `src/messaging/topology.ts`

Durable queues:

- `inventory.order_events`
- `orders.inventory_events`

Bindings:

- Inventory queue listens to `order.created`.
- Orders queue listens to `inventory.stock.reserved`.
- Orders queue listens to `inventory.stock.rejected`.

## Manual Test Plan

### Sufficient Stock

1. Ensure the product variant has enough stock.
2. Create an order.
3. Confirm the order is initially `pending`.
4. Confirm Inventory consumes `OrderCreated`.
5. Confirm stock decreases once.
6. Confirm Inventory publishes `StockReserved`.
7. Confirm Orders consumes `StockReserved`.
8. Confirm the order becomes `confirmed`.

### Insufficient Stock

1. Exhaust or lower the product variant stock.
2. Create an order requesting more than available stock.
3. Confirm Inventory attempts the decrement and rolls back.
4. Confirm a `StockRejected` outbox row is written after rollback.
5. Confirm Inventory publishes `StockRejected`.
6. Confirm Orders logs the rejection reason.
7. Confirm the order becomes `stock_rejected`.

### Inventory Consumer Down

1. Stop the Inventory consumer or prevent it from consuming messages.
2. Create an order.
3. Confirm the order remains `pending`.
4. Wait longer than `PENDING_ORDER_TIMEOUT_MS`.
5. Confirm the sweep marks the order `stock_rejected`.
6. Confirm the timeout-specific sweep log appears.

### Duplicate OrderCreated Delivery

1. Redeliver or republish the same `OrderCreated` event with the same
   `eventId`.
2. Confirm Inventory finds the event in `processed_events`.
3. Confirm stock is not decremented a second time.
4. Confirm no duplicate result event is produced.

## Verification

The TypeScript build passes:

```bash
npm run build
```

## Important Constraint

No part of Orders synchronously calls Inventory to decrement stock. Orders only
performs advisory stock checks during creation. The actual decrement happens in
Inventory after consuming `OrderCreated`.
