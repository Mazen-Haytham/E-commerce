import { randomUUID } from "crypto";
import { startConsumer } from "../../../messaging/consumer.js";
import { QUEUES, ROUTING_KEYS } from "../../../shared/exchnage.js";
import { prisma } from "../../../shared/prisma.js";
import { OutboxRepo } from "../../../shared/outbox/outboxRepo.js";
import { InventoryService } from "../service/inventoryService.js";
import { PrismaInventory } from "../repo/inventoryRepo.js";
import { InventoryApiImp } from "../Api/InvApiImp.js";
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
const outboxRepo = new OutboxRepo();

export async function startOrderCreatedConsumer(): Promise<void> {
  await startConsumer({
    queue: QUEUES.INVENTORY_ORDER_EVENTS,
    onMessage: async (envelope, routingKey) => {
      if (envelope.eventType !== ORDER_CREATED_EVENT_TYPE) {
        return;
      }

      const payload = envelope.payload as OrderCreatedPayload;
      let pendingEvent: PendingInventoryStockEvent | null = null;

      try {
        pendingEvent = await prisma.$transaction(async (tx) => {
          const existing = await tx.processedEvent.findUnique({
            where: {
              eventId_consumerName: {
                eventId: envelope.eventId,
                consumerName: CONSUMER_NAME,
              },
            },
          });

          if (existing) {
            console.log(
              `[InventoryOrderCreatedConsumer] duplicate eventId=${envelope.eventId}, skipping`,
            );
            return null;
          }

          // Check if order is already cancelled before reserving stock
          const orderResult = await tx.$queryRaw<Array<{ status: string }>>`
            SELECT status::text FROM "orders"."Order" 
            WHERE id = ${payload.orderId}::uuid 
            FOR UPDATE
          `;

          if (orderResult.length > 0 && orderResult[0].status === 'cancelled') {
            console.log(
              `[InventoryOrderCreatedConsumer] order ${payload.orderId} was already cancelled before reservation, skipping`,
            );
            
            // Mark event as processed so we don't retry it infinitely, 
            // but return null so no StockReserved event is produced.
            await tx.processedEvent.create({
              data: {
                eventId: envelope.eventId,
                consumerName: CONSUMER_NAME,
              },
            });
            return null;
          }

          console.log("[InventoryOrderCreatedConsumer] decrementing stock", {
            eventId: envelope.eventId,
            orderId: payload.orderId,
            userId: payload.userId,
            items: payload.items,
            routingKey,
          });

          await inventoryApi.decrementStockForOrderItems(payload.items, tx);

          const eventId = randomUUID();
          const occurredAt = new Date().toISOString();
          const stockReservedPayload: StockReservedPayload = {
            orderId: payload.orderId,
            originalEventId: envelope.eventId,
          };

          await outboxRepo.insertEvent(tx, {
            eventId,
            aggregateId: payload.orderId,
            aggregateType: "InventoryStock",
            eventType: STOCK_RESERVED_EVENT_TYPE,
            payload: stockReservedPayload,
          });

          await tx.processedEvent.create({
            data: {
              eventId: envelope.eventId,
              consumerName: CONSUMER_NAME,
            },
          });

          return {
            eventId,
            eventType: STOCK_RESERVED_EVENT_TYPE,
            occurredAt,
            routingKey: ROUTING_KEYS.INVENTORY_STOCK_RESERVED,
            payload: stockReservedPayload,
          };
        });
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

  return await prisma.$transaction(async (tx) => {
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

    await outboxRepo.insertEvent(tx, {
      eventId,
      aggregateId: orderId,
      aggregateType: "InventoryStock",
      eventType: STOCK_REJECTED_EVENT_TYPE,
      payload: stockRejectedPayload,
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
