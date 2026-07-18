import { prisma } from "../../../shared/prisma.js";
import { OrderPostgreSqlRepo } from "../Repo/OrderPostgreRepo.js";
import { ORDER_STATUS } from "../types/types.js";
import { publishEnvelope } from "../../../messaging/publisher.js";
import { ROUTING_KEYS } from "../../../shared/exchnage.js";
import { ORDER_CREATED_EVENT_TYPE } from "../events/orderCreatedEvent.js";
import { OutboxRepo } from "../../../shared/outbox/outboxRepo.js";

const SWEEP_INTERVAL_MS = Number(
  process.env.PENDING_ORDER_SWEEP_INTERVAL_MS || 60000,
);
const PENDING_ORDER_TIMEOUT_MS = Number(
  process.env.PENDING_ORDER_TIMEOUT_MS || 5 * 60 * 1000,
);

const orderRepo = new OrderPostgreSqlRepo();
const outboxRepo = new OutboxRepo();
let sweepTimer: ReturnType<typeof setInterval> | null = null;

export function startPendingOrderSweep(): void {
  if (sweepTimer) return;

  sweepTimer = setInterval(() => {
    runPendingOrderSweep().catch((err) => {
      console.error("[PendingOrderSweep] sweep failed", err);
    });
  }, SWEEP_INTERVAL_MS);

  console.log("[PendingOrderSweep] started", {
    intervalMs: SWEEP_INTERVAL_MS,
    timeoutMs: PENDING_ORDER_TIMEOUT_MS,
  });
}

export async function runPendingOrderSweep(): Promise<void> {
  const olderThan = new Date(Date.now() - PENDING_ORDER_TIMEOUT_MS);
  const pendingOrders = await prisma.order.findMany({
    where: {
      status: ORDER_STATUS.PENDING,
      createdAt: {
        lt: olderThan,
      },
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  for (const order of pendingOrders) {
    try {
      const outboxEvent = await prisma.outboxEvent.findFirst({
        where: {
          aggregateId: order.id,
          eventType: ORDER_CREATED_EVENT_TYPE,
          status: "PENDING", // skip already-published events
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (outboxEvent) {
        await publishEnvelope(ROUTING_KEYS.ORDER_CREATED, {
          eventId: outboxEvent.eventId,
          eventType: outboxEvent.eventType as typeof ORDER_CREATED_EVENT_TYPE,
          occurredAt: (outboxEvent.createdAt || new Date()).toISOString(),
          payload: outboxEvent.payload as any,
        });

        await outboxRepo.markPublished(outboxEvent.eventId);

        console.log("[PendingOrderSweep] republished order created event", {
          orderId: order.id,
          eventId: outboxEvent.eventId,
        });
      } else {
        console.warn(
          "[PendingOrderSweep] outbox event not found for pending order",
          {
            orderId: order.id,
          },
        );
      }
    } catch (err) {
      console.error("[PendingOrderSweep] failed to republish pending order", {
        orderId: order.id,
        err,
      });
    }
  }
}
