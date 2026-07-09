import { startConsumer } from "../../../messaging/consumer.js";
import { QUEUES } from "../../../shared/exchnage.js";
import { prisma } from "../../../shared/prisma.js";
import { InventoryService } from "../service/inventoryService.js";
import { PrismaInventory } from "../repo/inventoryRepo.js";
import { InventoryApiImp } from "../Api/InvApiImp.js";
import {
  ORDER_CANCELLED_EVENT_TYPE,
  OrderCancelledPayload,
} from "../../Orders/events/orderCancelledEvent.js";
import { STOCK_RESERVED_EVENT_TYPE } from "../events/inventoryStockEvent.js";

const CONSUMER_NAME = "inventory.order-cancelled-stock-increment";
const inventoryApi = new InventoryApiImp(
  new InventoryService(new PrismaInventory()),
);

export async function startOrderCancelledConsumer(): Promise<void> {
  await startConsumer({
    queue: QUEUES.INVENTORY_ORDER_EVENTS,
    onMessage: async (envelope, routingKey) => {
      if (envelope.eventType !== ORDER_CANCELLED_EVENT_TYPE) {
        return;
      }

      const payload = envelope.payload as OrderCancelledPayload;

      try {
        await prisma.$transaction(async (tx) => {
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
              `[InventoryOrderCancelledConsumer] duplicate eventId=${envelope.eventId}, skipping`,
            );
            return;
          }

          const stockReservedEvent = await tx.outboxEvent.findFirst({
            where: {
              aggregateId: payload.orderId,
              eventType: STOCK_RESERVED_EVENT_TYPE,
            },
          });

          if (stockReservedEvent) {
            console.log("[InventoryOrderCancelledConsumer] incrementing stock", {
              eventId: envelope.eventId,
              orderId: payload.orderId,
              items: payload.items,
              routingKey,
            });

            await inventoryApi.incrementStockForOrderItems(payload.items, tx);
          } else {
            console.log("[InventoryOrderCancelledConsumer] stock was never reserved, skipping", {
              eventId: envelope.eventId,
              orderId: payload.orderId,
              routingKey,
            });
          }

          // Mark event as processed (deduplication)
          await tx.processedEvent.create({
            data: {
              eventId: envelope.eventId,
              consumerName: CONSUMER_NAME,
            },
          });
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Stock increment failed";
        console.error(
          "[InventoryOrderCancelledConsumer] stock increment failed",
          { originalEventId: envelope.eventId, orderId: payload.orderId, reason },
        );
        // Do not throw here if we want to acknowledge the message and just log it,
        // or we throw to let the consumer retry/dead-letter it depending on the framework.
        // Assuming we throw to allow retry for dead-lettering, since this is a terminal action
        // and we really want the stock back.
        throw error;
      }
    },
  });
}
