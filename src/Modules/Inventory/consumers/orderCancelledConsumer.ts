import { startConsumer } from "../../../messaging/consumer.js";
import { QUEUES } from "../../../shared/exchnage.js";
import { inventoryPrisma } from "../../../shared/inventoryPrisma.js";
import { InventoryService } from "../service/inventoryService.js";
import { PrismaInventory } from "../repo/inventoryRepo.js";
import { InventoryApiImp } from "../Api/InvApiImp.js";
import { PrismaClient } from "../../../generated/inventory-prisma/index.js";
import { OrderReservationState } from "../../../generated/inventory-prisma/index.js";
import {
  ORDER_CANCELLED_EVENT_TYPE,
  OrderCancelledPayload,
} from "../../Orders/events/orderCancelledEvent.js";

const CONSUMER_NAME = "inventory.order-cancelled-stock-increment";
const inventoryApi = new InventoryApiImp(
  new InventoryService(new PrismaInventory()),
);

export interface OrderCancelledDeps {
  inventoryApi: Pick<InventoryApiImp, "incrementStockForOrderItems">;
}

/**
 * Core transaction logic for the OrderCancelled consumer.
 * Exported so tests can call it directly without spinning up RabbitMQ.
 *
 * Implements these transitions against inventory.order_reservation_state:
 *   T2 — no row         + OrderCancelled → insert PRE_CANCELLED (items stored), skip increment
 *   T4 — RESERVED       + OrderCancelled → increment stock, update to CANCELLED_AFTER_RESERVE
 *   T5 — terminal state + any event      → no-op
 */
export async function handleOrderCancelledTx(
  tx: PrismaClient,
  eventId: string,
  payload: OrderCancelledPayload,
  deps: OrderCancelledDeps,
): Promise<void> {
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
      `[InventoryOrderCancelledConsumer] duplicate eventId=${eventId}, skipping`,
    );
    return;
  }

  // ── 2. Atomic insert — wins the race or detects conflict ───────────────
  //
  // FOR UPDATE locks nothing when no row exists, creating the same race window
  // as in the Created consumer. Use the same insert-first pattern:
  // insert PRE_CANCELLED; if we win, we're T2; if a row already exists,
  // fall back to SELECT … FOR UPDATE to read the current state.
  const insertedRows = await tx.$queryRaw<Array<{ order_id: string }>>`
    INSERT INTO inventory.order_reservation_state (order_id, state, items)
    VALUES (
      ${payload.orderId}::uuid,
      'PRE_CANCELLED'::"inventory"."OrderReservationState",
      ${JSON.stringify(payload.items)}::jsonb
    )
    ON CONFLICT (order_id) DO NOTHING
    RETURNING order_id
  `;

  // ── 3. State machine ────────────────────────────────────────────────────

  if (insertedRows.length > 0) {
    // T2 happy path — cancel arrived first; PRE_CANCELLED inserted atomically.
    // Do NOT run any increment logic here. Record processedEvent and return.
    console.log(
      "[InventoryOrderCancelledConsumer] stock was never reserved, inserting PRE_CANCELLED",
      { eventId, orderId: payload.orderId },
    );
    await tx.processedEvent.create({
      data: { eventId, consumerName: CONSUMER_NAME },
    });
    return;
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
      `[InventoryOrderCancelledConsumer] order ${payload.orderId} already in terminal state ${reservation.state}, no-op`,
    );
    await tx.processedEvent.create({
      data: { eventId, consumerName: CONSUMER_NAME },
    });
    return;
  }

  // T4: RESERVED — stock was reserved; increment it back
  if (reservation?.state === OrderReservationState.RESERVED) {
    console.log("[InventoryOrderCancelledConsumer] incrementing stock", {
      eventId,
      orderId: payload.orderId,
      items: payload.items,
    });

    // Existing stock-increment logic — unchanged
    await deps.inventoryApi.incrementStockForOrderItems(payload.items, tx);

    await tx.orderReservation.update({
      where: { orderId: payload.orderId },
      data: { state: OrderReservationState.CANCELLED_AFTER_RESERVE },
    });

    await tx.processedEvent.create({
      data: { eventId, consumerName: CONSUMER_NAME },
    });
    return;
  }

  // Unexpected state (PRE_CANCELLED set by another concurrent handler,
  // PENDING_CREATE, or anything else) — no-op, log
  console.log(
    `[InventoryOrderCancelledConsumer] order ${payload.orderId} in unexpected reservation state ${reservation?.state}, no-op`,
  );
  await tx.processedEvent.create({
    data: { eventId, consumerName: CONSUMER_NAME },
  });
}

export async function startOrderCancelledConsumer(): Promise<void> {
  await startConsumer({
    queue: QUEUES.INVENTORY_ORDER_EVENTS,
    onMessage: async (envelope, routingKey) => {
      if (envelope.eventType !== ORDER_CANCELLED_EVENT_TYPE) {
        return;
      }

      const payload = envelope.payload as OrderCancelledPayload;

      try {
        await inventoryPrisma.$transaction((tx) =>
          handleOrderCancelledTx(tx as PrismaClient, envelope.eventId, payload, {
            inventoryApi,
          }),
        );
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : "Stock increment failed";
        console.error(
          "[InventoryOrderCancelledConsumer] stock increment failed",
          { originalEventId: envelope.eventId, orderId: payload.orderId, reason },
        );
        // Re-throw so the message broker can retry / dead-letter
        throw error;
      }
    },
  });
}
