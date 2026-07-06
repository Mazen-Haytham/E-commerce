import { prisma } from "../../../shared/prisma.js";
import { OrderPostgreSqlRepo } from "../Repo/OrderPostgreRepo.js";
import { ORDER_STATUS } from "../types/types.js";

const SWEEP_INTERVAL_MS = Number(
  process.env.PENDING_ORDER_SWEEP_INTERVAL_MS || 60000,
);
const PENDING_ORDER_TIMEOUT_MS = Number(
  process.env.PENDING_ORDER_TIMEOUT_MS || 5 * 60 * 1000,
);

const orderRepo = new OrderPostgreSqlRepo();
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
      await orderRepo.updateOrderStatus(
        {
          orderId: order.id,
          status: ORDER_STATUS.STOCK_REJECTED,
        },
        prisma,
      );

      console.log(
        "[PendingOrderSweep] pending order rejected due to stock timeout",
        {
          orderId: order.id,
          createdAt: order.createdAt,
          timeoutMs: PENDING_ORDER_TIMEOUT_MS,
        },
      );
    } catch (err) {
      console.error("[PendingOrderSweep] failed to reject pending order", {
        orderId: order.id,
        err,
      });
    }
  }
}
