# RabbitMQ setup for this project

## What's in here

```
src/messaging/
  connection.ts   — connect to RabbitMQ, auto-reconnect, expose channels
  topology.ts     — declare exchanges, queues, and bindings (the "shape" of the bus)
  publisher.ts     — publishEvent(routingKey, payload)
  consumer.ts      — startConsumer({ queue, onMessage })
  index.ts         — single import point for everything above
  Exchanges.ts     — kept for backward compatibility, now just re-exports topology.ts

src/shared/
  exchnage.ts      — EXCHANGES, ROUTING_KEYS, QUEUES constants
  events.ts        — EventEnvelope<T> type every message gets wrapped in

src/Modules/Orders/service/OrderService.example.ts
src/Modules/Inventory/service/inventoryConsumer.example.ts
  — show the pattern end to end: Orders publishes, Inventory consumes and replies

docker-compose.yml — local RabbitMQ broker + management UI
.env.example        — RABBITMQ_URL etc.
```

## Wiring it into your app

In `server.ts`, before you start listening for HTTP requests:

```typescript
import { initMessaging, closeRabbitMQ } from "./messaging/index.js";
import { registerInventoryConsumers } from "./Modules/Inventory/service/inventoryConsumer.js";

await initMessaging();
await registerInventoryConsumers(inventoryService);

process.on("SIGTERM", async () => {
  await closeRabbitMQ();
  process.exit(0);
});
```

`initMessaging()` connects and declares the topology. Each module that
consumes events registers its own consumer afterward — that keeps the
messaging core ignorant of what Orders or Inventory actually do.

## Why these specific choices

**Topic exchange, not direct or fanout.** A topic exchange lets queues bind
with wildcard patterns (`order.*`, `inventory.#`), so you don't have to
redeclare bindings every time you add a new event under an existing prefix.
Direct exchanges require exact routing key matches; fanout ignores routing
keys entirely and broadcasts to everyone — neither fits a system with this
many distinct event types.

**Two channels, not one.** A `ConfirmChannel` for publishing means the
broker acknowledges "I've written this to disk" before your code considers
the publish done — that's what makes `await publishEvent(...)` meaningful.
A plain `Channel` for consuming gives you manual control over ack/nack and
lets you set `prefetch`, which caps how many unacknowledged messages a
consumer can hold at once (without it, a slow consumer can be handed
thousands of messages it can't keep up with).

**One durable queue per consumer, not one queue per event type.** If
Inventory needs both `order.created` and `order.cancelled`, it gets a single
queue bound to both routing keys, rather than two separate queues. This
mirrors how the team actually thinks about it: "what does Inventory need to
react to," not "how many event types exist."

**Dead-letter exchange instead of infinite requeue.** Every queue declares
`x-dead-letter-exchange`. If your `onMessage` handler throws, `consumer.ts`
calls `channel.nack(msg, false, false)` — the `false, false` means "don't
requeue it here," so RabbitMQ automatically reroutes it to the DLQ. Without
this, a message with bad data would requeue and get redelivered forever,
pinning your CPU on a message that will never succeed.

**Event envelope instead of raw payloads.** Wrapping every payload in
`{ eventId, eventName, occurredAt, payload }` costs almost nothing up front
and saves you later — `eventId` is what you'd check against to make a
consumer idempotent (RabbitMQ guarantees *at-least-once* delivery, meaning
the same message can arrive twice after a network blip or a crash mid-ack).

## Vocabulary, if any of this is new

- **Exchange** — the mailbox a producer drops messages into. It doesn't
  store anything; it just decides which queues should get a copy.
- **Queue** — where messages actually sit until a consumer picks them up.
- **Routing key** — a label on the message (e.g. `order.created`) the
  exchange uses to decide which queues should receive it.
- **Binding** — the rule connecting an exchange to a queue ("send anything
  matching this pattern to this queue").
- **Ack / nack** — how a consumer tells RabbitMQ "done, delete it" or
  "failed, don't redeliver it here."
- **Durable** — survives a broker restart. Always durable for anything you
  can't afford to lose.
- **Prefetch** — how many unacknowledged messages a consumer can be holding
  at once before RabbitMQ stops sending it more.

## A couple of things worth learning next, not built here

- **Idempotent consumers** — store processed `eventId`s somewhere (Redis,
  a Postgres table) and skip duplicates, since at-least-once delivery means
  duplicates *will* happen eventually.
- **The outbox pattern** — if a service needs the DB write and the publish
  to be all-or-nothing, write the event to an "outbox" table in the same DB
  transaction, then have a separate worker publish from that table. This
  setup publishes right after the DB write, which is fine for most cases but
  not airtight if the process crashes in between.
