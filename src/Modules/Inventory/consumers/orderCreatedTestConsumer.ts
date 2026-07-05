import { startConsumer } from "../../../messaging/consumer.js";
import { QUEUES } from "../../../shared/exchnage.js";
import { prisma } from "../../../shared/prisma.js";
import {
  ORDER_CREATED_EVENT_TYPE,
  OrderCreatedPayload,
} from "../../Orders/events/orderCreatedEvent.js";

const CONSUMER_NAME = "inventory.order-created-test";

export async function startOrderCreatedTestConsumer(): Promise<void> {
  await startConsumer({
    queue: QUEUES.INVENTORY_ORDER_EVENTS,
    onMessage: async (envelope, routingKey) => {
      if (envelope.eventType !== ORDER_CREATED_EVENT_TYPE) {
        return;
      }

      const existing = await prisma.processedEvent.findUnique({
        where: {
          eventId_consumerName: {
            eventId: envelope.eventId,
            consumerName: CONSUMER_NAME,
          },
        },
      });

      if (existing) {
        console.log(
          `[OrderCreatedTestConsumer] duplicate eventId=${envelope.eventId}, skipping`,
        );
        return;
      }

      const payload = envelope.payload as OrderCreatedPayload;
      console.log("[OrderCreatedTestConsumer] processing OrderCreated", {
        eventId: envelope.eventId,
        orderId: payload.orderId,
        userId: payload.userId,
        items: payload.items,
        routingKey,
      });

      await prisma.processedEvent.create({
        data: {
          eventId: envelope.eventId,
          consumerName: CONSUMER_NAME,
        },
      });
    },
  });
}
