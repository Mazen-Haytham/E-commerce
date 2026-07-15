/**
 * Integration tests for the order_reservation_state state machine.
 *
 * Tests run against a real Postgres database (same pattern as
 * order-stock-concurrency.integration.test.ts). RabbitMQ is never touched —
 * we call the exported handler functions directly inside prisma.$transaction.
 *
 * Covered transitions:
 *   T1 — no row + OrderCreated        → RESERVED, stock decremented
 *   T2 — no row + OrderCancelled      → PRE_CANCELLED, stock untouched
 *   T3 — PRE_CANCELLED + OrderCreated → CANCELLED_AFTER_RESERVE, stock untouched
 *   T4 — RESERVED + OrderCancelled    → CANCELLED_AFTER_RESERVE, stock incremented back
 *   T5 — terminal state + any event   → no-op, row unchanged
 */
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "crypto";
import { prisma } from "../shared/prisma.js";
import { redis } from "../shared/redis.js";
import { PrismaClient } from "@prisma/client/extension";
import { OrderReservationState } from "../generated/prisma/index.js";
import { PrismaInventory } from "../Modules/Inventory/repo/inventoryRepo.js";
import { InventoryService } from "../Modules/Inventory/service/inventoryService.js";
import { InventoryApiImp } from "../Modules/Inventory/Api/InvApiImp.js";
import { OutboxRepo } from "../shared/outbox/outboxRepo.js";
import {
  handleOrderCreatedTx,
  OrderCreatedDeps,
} from "../Modules/Inventory/consumers/orderCreatedConsumer.js";
import {
  handleOrderCancelledTx,
  OrderCancelledDeps,
} from "../Modules/Inventory/consumers/orderCancelledConsumer.js";

// ── Shared deps ────────────────────────────────────────────────────────────
const inventoryApi = new InventoryApiImp(
  new InventoryService(new PrismaInventory()),
);
const outboxRepo = new OutboxRepo();
const createdDeps: OrderCreatedDeps = { inventoryApi, outboxRepo };
const cancelledDeps: OrderCancelledDeps = { inventoryApi };

test.after(async () => {
  redis.disconnect();
  await prisma.$disconnect();
});

// ── Fixture helpers ────────────────────────────────────────────────────────

/**
 * Creates a product variant + inventory location + ProductStock row.
 * Returns the IDs needed to build an order payload and check stock.
 */
async function createStockFixture(stockLevel: number) {
  const suffix = randomUUID();
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: `Reservation test product ${suffix}`,
        producer: "Integration Test",
        variants: {
          create: { sku: `rsv-${suffix}`, weight: "1kg", price: 10 },
        },
      },
      include: { variants: true },
    });

    const inventory = await tx.inventory.create({
      data: {
        name: `Reservation test inv ${suffix}`,
        location: `rsv-${suffix}`,
      },
    });

    await tx.productStock.create({
      data: {
        productVariantId: product.variants[0].id,
        inventoryId: inventory.id,
        stockLevel,
        restockAlert: 0,
      },
    });

    return {
      productVariantId: product.variants[0].id,
      inventoryId: inventory.id,
    };
  });
}

/** Reads the current stock level for a (variant, inventory) pair. */
async function readStockLevel(productVariantId: string, inventoryId: string) {
  const row = await prisma.productStock.findUniqueOrThrow({
    where: { productVariantId_inventoryId: { productVariantId, inventoryId } },
    select: { stockLevel: true },
  });
  return row.stockLevel;
}

/** Reads the current OrderReservation row (null if absent). */
async function readReservation(orderId: string) {
  return prisma.orderReservation.findUnique({ where: { orderId } });
}

// ══════════════════════════════════════════════════════════════════════════
// T1 — no row + OrderCreated → RESERVED, stock decremented
// ══════════════════════════════════════════════════════════════════════════
test("T1: no reservation row + OrderCreated → inserts RESERVED row and decrements stock", async () => {
  const orderId = randomUUID();
  const eventId = randomUUID();
  const quantity = 1;

  const { productVariantId, inventoryId } = await createStockFixture(10);

  const payload = {
    orderId,
    userId: randomUUID(),
    items: [{ productVariantId, quantity }],
  };

  const result = await prisma.$transaction((tx) =>
    handleOrderCreatedTx(
      tx as unknown as PrismaClient,
      eventId,
      payload,
      createdDeps,
    ),
  );

  // Should return a StockReserved pending event
  assert.ok(result !== null, "expected a StockReserved pending event");
  assert.equal(result!.eventType, "StockReserved");

  // Reservation row should be RESERVED
  const reservation = await readReservation(orderId);
  assert.ok(reservation, "expected OrderReservation row to exist");
  assert.equal(reservation!.state, OrderReservationState.RESERVED);

  // Stock should be decremented
  const stock = await readStockLevel(productVariantId, inventoryId);
  assert.equal(stock, 10 - quantity, `expected stock to drop by ${quantity}`);
});

// ══════════════════════════════════════════════════════════════════════════
// T2 — no row + OrderCancelled → PRE_CANCELLED, stock NOT incremented
// ══════════════════════════════════════════════════════════════════════════
test("T2: no reservation row + OrderCancelled → inserts PRE_CANCELLED row, stock untouched", async () => {
  const orderId = randomUUID();
  const eventId = randomUUID();
  const quantity = 2;

  const { productVariantId, inventoryId } = await createStockFixture(5);
  const stockBefore = await readStockLevel(productVariantId, inventoryId);

  const payload = {
    orderId,
    previousStatus: "pending",
    items: [{ productVariantId, quantity }],
  };

  await prisma.$transaction((tx) =>
    handleOrderCancelledTx(
      tx as unknown as PrismaClient,
      eventId,
      payload,
      cancelledDeps,
    ),
  );

  // Reservation row should be PRE_CANCELLED with items stored
  const reservation = await readReservation(orderId);
  assert.ok(reservation, "expected OrderReservation row to exist");
  assert.equal(reservation!.state, OrderReservationState.PRE_CANCELLED);
  assert.ok(
    reservation!.items !== null,
    "expected items to be stored on PRE_CANCELLED row",
  );

  // Stock must be unchanged — nothing was ever reserved
  const stockAfter = await readStockLevel(productVariantId, inventoryId);
  assert.equal(
    stockAfter,
    stockBefore,
    "expected stock to be unchanged when no reservation existed",
  );
});

// ══════════════════════════════════════════════════════════════════════════
// T3 — PRE_CANCELLED + OrderCreated → CANCELLED_AFTER_RESERVE, no decrement
// ══════════════════════════════════════════════════════════════════════════
test("T3: PRE_CANCELLED row + OrderCreated → updates to CANCELLED_AFTER_RESERVE, stock NOT decremented", async () => {
  const orderId = randomUUID();
  const eventId = randomUUID();
  const quantity = 3;

  const { productVariantId, inventoryId } = await createStockFixture(8);

  // Pre-condition: cancel arrived first → PRE_CANCELLED row already exists
  await prisma.orderReservation.create({
    data: {
      orderId,
      state: OrderReservationState.PRE_CANCELLED,
      items: [{ productVariantId, quantity }],
    },
  });

  const stockBefore = await readStockLevel(productVariantId, inventoryId);

  const payload = {
    orderId,
    userId: randomUUID(),
    items: [{ productVariantId, quantity }],
  };

  const result = await prisma.$transaction((tx) =>
    handleOrderCreatedTx(
      tx as unknown as PrismaClient,
      eventId,
      payload,
      createdDeps,
    ),
  );

  // Must NOT produce a StockReserved event
  assert.equal(result, null, "expected null — no StockReserved for a pre-cancelled order");

  // Row should advance to CANCELLED_AFTER_RESERVE
  const reservation = await readReservation(orderId);
  assert.ok(reservation, "expected OrderReservation row to still exist");
  assert.equal(
    reservation!.state,
    OrderReservationState.CANCELLED_AFTER_RESERVE,
  );

  // Stock must be unchanged — decrement must never have run
  const stockAfter = await readStockLevel(productVariantId, inventoryId);
  assert.equal(
    stockAfter,
    stockBefore,
    "expected stock to be unchanged for a pre-cancelled order",
  );
});

// ══════════════════════════════════════════════════════════════════════════
// T4 — RESERVED + OrderCancelled → CANCELLED_AFTER_RESERVE, stock incremented
// ══════════════════════════════════════════════════════════════════════════
test("T4: RESERVED row + OrderCancelled → updates to CANCELLED_AFTER_RESERVE and increments stock back", async () => {
  const orderId = randomUUID();
  const eventId = randomUUID();
  const quantity = 2;
  const initialStock = 5;

  const { productVariantId, inventoryId } = await createStockFixture(
    initialStock - quantity, // simulate stock already decremented
  );

  // Pre-condition: OrderCreated was already processed → RESERVED row exists
  await prisma.orderReservation.create({
    data: { orderId, state: OrderReservationState.RESERVED },
  });

  const payload = {
    orderId,
    previousStatus: "confirmed",
    items: [{ productVariantId, quantity }],
  };

  await prisma.$transaction((tx) =>
    handleOrderCancelledTx(
      tx as unknown as PrismaClient,
      eventId,
      payload,
      cancelledDeps,
    ),
  );

  // Row should be CANCELLED_AFTER_RESERVE
  const reservation = await readReservation(orderId);
  assert.ok(reservation, "expected OrderReservation row to still exist");
  assert.equal(
    reservation!.state,
    OrderReservationState.CANCELLED_AFTER_RESERVE,
  );

  // Stock should be incremented back by quantity
  const stockAfter = await readStockLevel(productVariantId, inventoryId);
  assert.equal(
    stockAfter,
    initialStock - quantity + quantity,
    "expected stock to be restored after cancellation",
  );
});

// ══════════════════════════════════════════════════════════════════════════
// T5 — terminal state + any event → no-op, row unchanged
// ══════════════════════════════════════════════════════════════════════════
test("T5: CANCELLED_AFTER_RESERVE row + OrderCreated → no-op, row state unchanged", async () => {
  const orderId = randomUUID();
  const createdEventId = randomUUID();
  const cancelledEventId = randomUUID();
  const quantity = 1;

  const { productVariantId, inventoryId } = await createStockFixture(5);
  const stockBefore = await readStockLevel(productVariantId, inventoryId);

  // Pre-condition: order is already fully terminal
  await prisma.orderReservation.create({
    data: { orderId, state: OrderReservationState.CANCELLED_AFTER_RESERVE },
  });

  // Fire OrderCreated against a terminal row
  const createdResult = await prisma.$transaction((tx) =>
    handleOrderCreatedTx(
      tx as unknown as PrismaClient,
      createdEventId,
      { orderId, userId: randomUUID(), items: [{ productVariantId, quantity }] },
      createdDeps,
    ),
  );

  assert.equal(
    createdResult,
    null,
    "OrderCreated on terminal row should be a no-op (null result)",
  );

  // Fire OrderCancelled against the same terminal row (different eventId for dedup)
  await prisma.$transaction((tx) =>
    handleOrderCancelledTx(
      tx as unknown as PrismaClient,
      cancelledEventId,
      { orderId, previousStatus: "cancelled", items: [{ productVariantId, quantity }] },
      cancelledDeps,
    ),
  );

  // Row must remain CANCELLED_AFTER_RESERVE — not mutated by either event
  const reservation = await readReservation(orderId);
  assert.equal(
    reservation!.state,
    OrderReservationState.CANCELLED_AFTER_RESERVE,
    "expected terminal row state to be unchanged",
  );

  // Stock must be completely untouched
  const stockAfter = await readStockLevel(productVariantId, inventoryId);
  assert.equal(
    stockAfter,
    stockBefore,
    "expected stock to be unchanged after no-op events on terminal row",
  );
});
