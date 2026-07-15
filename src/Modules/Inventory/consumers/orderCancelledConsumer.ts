import { startConsumer } from "../../../messaging/consumer.js";
import { QUEUES } from "../../../shared/exchnage.js";
import { prisma } from "../../../shared/prisma.js";
import { InventoryService } from "../service/inventoryService.js";
import { PrismaInventory } from "../repo/inventoryRepo.js";
import { InventoryApiImp } from "../Api/InvApiImp.js";
import { PrismaClient } from "@prisma/client/extension";
import { OrderReservationState } from "../../../generated/prisma/index.js";
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

  // ── 2. Lock the local reservation row (empty array = no row yet) ───────
  const reservationRows = await tx.$queryRaw<
    Array<{ state: string; items: unknown }>
  >`
    SELECT state, items
    FROM inventory.order_reservation_state
    WHERE order_id = ${payload.orderId}::uuid
    FOR UPDATE
  `;
  const reservation = reservationRows[0] ?? null;

  // ── 3. State machine ────────────────────────────────────────────────────

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

  // T2: no row — cancel arrived before create; store items for audit, do NOT increment
  if (reservation === null) {
    console.log(
      "[InventoryOrderCancelledConsumer] stock was never reserved, inserting PRE_CANCELLED",
      { eventId, orderId: payload.orderId },
    );

    await tx.orderReservation.create({
      data: {
        orderId: payload.orderId,
        state: OrderReservationState.PRE_CANCELLED,
        items: payload.items as object[],
      },
    });

    await tx.processedEvent.create({
      data: { eventId, consumerName: CONSUMER_NAME },
    });
    return;
  }

  // Unexpected state (PENDING_CREATE or anything else) — no-op, log
  console.log(
    `[InventoryOrderCancelledConsumer] order ${payload.orderId} in unexpected reservation state ${reservation.state}, no-op`,
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
        await prisma.$transaction((tx) =>
          handleOrderCancelledTx(
            tx as unknown as PrismaClient,
            envelope.eventId,
            payload,
            { inventoryApi },
          ),
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
