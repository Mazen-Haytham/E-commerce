import { randomUUID } from "crypto";
import { startConsumer } from "../../../messaging/consumer.js";
import { QUEUES, ROUTING_KEYS } from "../../../shared/exchnage.js";
import { inventoryPrisma } from "../../../shared/inventoryPrisma.js";
import { InventoryOutboxRepo } from "../outbox/inventoryOutboxRepo.js";
import { InventoryService } from "../service/inventoryService.js";
import { PrismaInventory } from "../repo/inventoryRepo.js";
import { InventoryApiImp } from "../Api/InvApiImp.js";
import { PrismaClient } from "../../../generated/inventory-prisma/index.js";
import { OrderReservationState } from "../../../generated/inventory-prisma/index.js";
import {
  PendingInventoryStockEvent,
  STOCK_REJECTED_EVENT_TYPE,
  STOCK_RESERVED_EVENT_TYPE,
  StockRejectedPayload,
  StockReservedPayload,
} from "../events/inventoryStockEvent.js";
import {
  ORDER_CREATED_EVENT_TYPE,
  OrderCreatedPayload,
} from "../../Orders/events/orderCreatedEvent.js";
import { publishEnvelope } from "../../../messaging/publisher.js";

const CONSUMER_NAME = "inventory.order-created-stock-decrement";
const inventoryApi = new InventoryApiImp(
  new InventoryService(new PrismaInventory()),
);
const outboxRepo = new InventoryOutboxRepo();

export interface OrderCreatedDeps {
  inventoryApi: Pick<InventoryApiImp, "decrementStockForOrderItems">;
  outboxRepo: Pick<InventoryOutboxRepo, "insertEvent">;
}

/**
 * Core transaction logic for the OrderCreated consumer.
 * Exported so tests can call it directly without spinning up RabbitMQ.
 *
 * Implements these transitions against inventory.order_reservation_state:
 *   T1 — no row           + OrderCreated  → decrement stock, insert RESERVED
 *   T3 — PRE_CANCELLED    + OrderCreated  → skip decrement, update to CANCELLED_AFTER_RESERVE
 *   T5 — terminal state   + any event     → no-op
 */
export async function handleOrderCreatedTx(
  tx: PrismaClient,
  eventId: string,
  payload: OrderCreatedPayload,
  deps: OrderCreatedDeps,
): Promise<PendingInventoryStockEvent | null> {
  // ── 1. Dedup check (unchanged) ─────────────────────────────────────────
  const existing = await tx.processedEvent.findUnique({
    where: {
      eventId_consumerName: {
        eventId,
        consumerName: CONSUMER_NAME,
      },
    },
  });

  if (existing) {
    console.log(
      `[InventoryOrderCreatedConsumer] duplicate eventId=${eventId}, skipping`,
    );
    return null;
  }

  // ── 2. Atomic insert — wins the race or detects conflict ───────────────
  //
  // FOR UPDATE locks nothing when no row exists, creating a race window where
  // two concurrent handlers both read "no row" and both attempt INSERT, causing
  // a unique-constraint violation on the second writer.
  //
  // Instead: attempt INSERT first with ON CONFLICT DO NOTHING RETURNING order_id.
  // Whoever gets a row back owns the write; the loser falls back to
  // SELECT … FOR UPDATE to read the now-existing row and act accordingly.
  const insertedRows = await tx.$queryRaw<Array<{ order_id: string }>>`
    INSERT INTO inventory.order_reservation_state (order_id, state)
    VALUES (${payload.orderId}::uuid, 'RESERVED'::"inventory"."OrderReservationState")
    ON CONFLICT (order_id) DO NOTHING
    RETURNING order_id
  `;

  // ── 3. State machine ────────────────────────────────────────────────────

  if (insertedRows.length > 0) {
    // T1 happy path — we won the insert race; this is definitively the first
    // writer. Run decrement and emit StockReserved. No further SELECT needed.
    console.log("[InventoryOrderCreatedConsumer] decrementing stock", {
      eventId,
      orderId: payload.orderId,
      userId: payload.userId,
      items: payload.items,
    });

    await deps.inventoryApi.decrementStockForOrderItems(payload.items, tx);

    const newEventId = randomUUID();
    const occurredAt = new Date().toISOString();
    const stockReservedPayload: StockReservedPayload = {
      orderId: payload.orderId,
      originalEventId: eventId,
    };

    await deps.outboxRepo.insertEvent(tx, {
      eventId: newEventId,
      aggregateId: payload.orderId,
      aggregateType: "InventoryStock",
      eventType: STOCK_RESERVED_EVENT_TYPE,
      payload: stockReservedPayload,
    });

    await tx.processedEvent.create({
      data: { eventId, consumerName: CONSUMER_NAME },
    });

    return {
      eventId: newEventId,
      eventType: STOCK_RESERVED_EVENT_TYPE,
      occurredAt,
      routingKey: ROUTING_KEYS.INVENTORY_STOCK_RESERVED,
      payload: stockReservedPayload,
    };
  }

  // INSERT returned no row → a row already exists (conflict). Fall back to
  // SELECT … FOR UPDATE so we can read the current state and branch correctly.
  // A conflict is NOT an error — it is a normal, expected racing outcome.
  const reservationRows = await tx.$queryRaw<
    Array<{ state: string; items: unknown }>
  >`
    SELECT state, items
    FROM inventory.order_reservation_state
    WHERE order_id = ${payload.orderId}::uuid
    FOR UPDATE
  `;
  const reservation = reservationRows[0] ?? null;

  // T5: terminal state — no-op, do not modify row further
  if (
    reservation?.state === OrderReservationState.CANCELLED_AFTER_RESERVE ||
    reservation?.state === OrderReservationState.REJECTED
  ) {
    console.log(
      `[InventoryOrderCreatedConsumer] order ${payload.orderId} already in terminal state ${reservation.state}, no-op`,
    );
    await tx.processedEvent.create({
      data: { eventId, consumerName: CONSUMER_NAME },
    });
    return null;
  }

  // T3: PRE_CANCELLED — cancel arrived before create; must NOT reserve stock
  if (reservation?.state === OrderReservationState.PRE_CANCELLED) {
    console.log(
      `[InventoryOrderCreatedConsumer] skipped reservation, order ${payload.orderId} was pre-cancelled`,
    );
    await tx.orderReservation.update({
      where: { orderId: payload.orderId },
      data: { state: OrderReservationState.CANCELLED_AFTER_RESERVE },
    });
    await tx.processedEvent.create({
      data: { eventId, consumerName: CONSUMER_NAME },
    });
    return null;
  }

  // Unexpected state (RESERVED set by another concurrent handler,
  // PENDING_CREATE, or anything else) — no-op, log
  console.log(
    `[InventoryOrderCreatedConsumer] order ${payload.orderId} in unexpected reservation state ${reservation?.state}, no-op`,
  );
  await tx.processedEvent.create({
    data: { eventId, consumerName: CONSUMER_NAME },
  });
  return null;
}

export async function startOrderCreatedConsumer(): Promise<void> {
  await startConsumer({
    queue: QUEUES.INVENTORY_ORDER_CREATED_EVENTS,
    onMessage: async (envelope, routingKey) => {
      if (envelope.eventType !== ORDER_CREATED_EVENT_TYPE) {
        return;
      }

      const payload = envelope.payload as OrderCreatedPayload;
      let pendingEvent: PendingInventoryStockEvent | null = null;

      try {
        pendingEvent = await inventoryPrisma.$transaction((tx) =>
          handleOrderCreatedTx(tx as PrismaClient, envelope.eventId, payload, {
            inventoryApi,
            outboxRepo,
          }),
        );
      } catch (error) {
        pendingEvent = await recordStockRejectedEvent(
          payload.orderId,
          envelope.eventId,
          error,
        );
      }

      if (pendingEvent) {
        await tryPublishInventoryStockEvent(pendingEvent);
      }
    },
  });
}

async function recordStockRejectedEvent(
  orderId: string,
  originalEventId: string,
  error: unknown,
): Promise<PendingInventoryStockEvent | null> {
  const reason =
    error instanceof Error ? error.message : "Stock decrement failed";

  console.error(
    "[InventoryOrderCreatedConsumer] stock decrement failed; recording StockRejected event",
    { originalEventId, orderId, reason },
  );

  return await inventoryPrisma.$transaction(async (tx) => {
    const existing = await tx.processedEvent.findUnique({
      where: {
        eventId_consumerName: {
          eventId: originalEventId,
          consumerName: CONSUMER_NAME,
        },
      },
    });

    if (existing) {
      console.log(
        `[InventoryOrderCreatedConsumer] duplicate eventId=${originalEventId}, skipping rejected write`,
      );
      return null;
    }

    const eventId = randomUUID();
    const occurredAt = new Date().toISOString();
    const stockRejectedPayload: StockRejectedPayload = {
      orderId,
      reason,
    };

    await outboxRepo.insertEvent(tx as PrismaClient, {
      eventId,
      aggregateId: orderId,
      aggregateType: "InventoryStock",
      eventType: STOCK_REJECTED_EVENT_TYPE,
      payload: stockRejectedPayload,
    });

    // Mark reservation as REJECTED so any subsequent event is a no-op (T5)
    await tx.orderReservation.upsert({
      where: { orderId },
      create: { orderId, state: OrderReservationState.REJECTED },
      update: { state: OrderReservationState.REJECTED },
    });

    await tx.processedEvent.create({
      data: {
        eventId: originalEventId,
        consumerName: CONSUMER_NAME,
      },
    });

    return {
      eventId,
      eventType: STOCK_REJECTED_EVENT_TYPE,
      occurredAt,
      routingKey: ROUTING_KEYS.INVENTORY_STOCK_REJECTED,
      payload: stockRejectedPayload,
    };
  });
}

async function tryPublishInventoryStockEvent(
  pendingEvent: PendingInventoryStockEvent,
): Promise<void> {
  try {
    await publishEnvelope(pendingEvent.routingKey, {
      eventId: pendingEvent.eventId,
      eventType: pendingEvent.eventType,
      occurredAt: pendingEvent.occurredAt,
      payload: pendingEvent.payload,
    });
    await outboxRepo.markPublished(pendingEvent.eventId);
  } catch (err) {
    console.error(
      "[InventoryOrderCreatedConsumer] failed to publish inventory stock event; outbox row retained for relay",
      { eventId: pendingEvent.eventId, eventType: pendingEvent.eventType, err },
    );
  }
}
