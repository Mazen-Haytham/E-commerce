import { startConsumer } from "../../../messaging/consumer.js";
import { QUEUES } from "../../../shared/exchnage.js";
import { prisma } from "../../../shared/prisma.js";
import { ORDER_STATUS } from "../types/types.js";
import { OrderPostgreSqlRepo } from "../Repo/OrderPostgreRepo.js";
import {
  STOCK_REJECTED_EVENT_TYPE,
  STOCK_RESERVED_EVENT_TYPE,
  StockRejectedPayload,
  StockReservedPayload,
} from "../../Inventory/events/inventoryStockEvent.js";

const CONSUMER_NAME = "orders.inventory-stock-events";
const orderRepo = new OrderPostgreSqlRepo();

export async function startInventoryStockConsumer(): Promise<void> {
  await startConsumer({
    queue: QUEUES.ORDERS_INVENTORY_EVENTS,
    onMessage: async (envelope) => {
      if (
        envelope.eventType !== STOCK_RESERVED_EVENT_TYPE &&
        envelope.eventType !== STOCK_REJECTED_EVENT_TYPE
      ) {
        return;
      }

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
            `[OrdersInventoryStockConsumer] duplicate eventId=${envelope.eventId}, skipping`,
          );
          return;
        }

        if (envelope.eventType === STOCK_RESERVED_EVENT_TYPE) {
          const payload = envelope.payload as StockReservedPayload;
          await orderRepo.updateOrderStatus(
            {
              orderId: payload.orderId,
              status: ORDER_STATUS.CONFIRMED,
            },
            tx,
          );
        }

        if (envelope.eventType === STOCK_REJECTED_EVENT_TYPE) {
          const payload = envelope.payload as StockRejectedPayload;
          console.log("[OrdersInventoryStockConsumer] stock rejected", {
            orderId: payload.orderId,
            reason: payload.reason,
          });

          await orderRepo.updateOrderStatus(
            {
              orderId: payload.orderId,
              status: ORDER_STATUS.STOCK_REJECTED,
            },
            tx,
          );
        }

        await tx.processedEvent.create({
          data: {
            eventId: envelope.eventId,
            consumerName: CONSUMER_NAME,
          },
        });
      });
    },
  });
}
