import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "crypto";
import { prisma } from "../shared/prisma.js";
import { inventoryPrisma } from "../shared/inventoryPrisma.js";
import { redis } from "../shared/redis.js";
import { OrderService } from "../Modules/Orders/Service/OrderService.js";
import { OrderPostgreSqlRepo } from "../Modules/Orders/Repo/OrderPostgreRepo.js";
import { UserImp } from "../Modules/User/src/Api/userImplementation.js";
import { UserService } from "../Modules/User/src/service/userService.js";
import { PrismaUserRepo } from "../Modules/User/src/repo/userRepo.js";
import { ProductApiImp } from "../Modules/Catalog/Product/API/productApiImp.js";
import { ProductService } from "../Modules/Catalog/Product/service/productService.js";
import { ProductPostgreSqlRepo } from "../Modules/Catalog/Product/repo/ProductRepo.js";
import { CategoryApiImp } from "../Modules/Catalog/Category/API/categoryApiImp.js";
import { CategoryService } from "../Modules/Catalog/Category/service/categoryService.js";
import { PrismaProductRepo as CategoryPostgreSqlRepo } from "../Modules/Catalog/Category/repo/CatalogRepo.js";
import { InventoryApiImp } from "../Modules/Inventory/Api/InvApiImp.js";
import { InventoryService } from "../Modules/Inventory/service/inventoryService.js";
import { PrismaInventory } from "../Modules/Inventory/repo/inventoryRepo.js";
import { ORDER_STATUS } from "../Modules/Orders/types/types.js";

const inventoryRepo = new PrismaInventory();
const inventoryService = new InventoryService(inventoryRepo);
const inventoryApi = new InventoryApiImp(inventoryService);

const orderService = new OrderService(
  new OrderPostgreSqlRepo(),
  new UserImp(new UserService(new PrismaUserRepo())),
  new ProductApiImp(
    new ProductService(new ProductPostgreSqlRepo(), inventoryApi),
  ),
  new CategoryApiImp(new CategoryService(new CategoryPostgreSqlRepo())),
  inventoryApi,
);

test.after(async () => {
  redis.disconnect();
  await prisma.$disconnect();
  await inventoryPrisma.$disconnect();
});

test("FOR UPDATE stock decrement lock prevents overselling under concurrent order reservations", async () => {
  const suffix = randomUUID();
  const userId = randomUUID();

  const productVariantId = await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        id: userId,
        email: `stock-lock-${suffix}@example.test`,
        firstName: "Stock",
        lastName: "Lock",
        password: "not-used",
        phone: `lock-${suffix.slice(0, 12)}`,
      },
    });

    const product = await tx.product.create({
      data: {
        name: `Stock lock product ${suffix}`,
        producer: "Integration Test",
        variants: {
          create: {
            sku: `stock-lock-${suffix}`,
            weight: "1kg",
            price: 10,
          },
        },
      },
      include: {
        variants: true,
      },
    });

    return product.variants[0].id;
  });

  const inventory = await inventoryPrisma.inventory.create({
    data: {
      name: `Stock lock inventory ${suffix}`,
      location: `test-${suffix}`,
    },
  });

  await inventoryPrisma.productStock.create({
    data: {
      productVariantId,
      inventoryId: inventory.id,
      stockLevel: 1,
      restockAlert: 0,
    },
  });

  const inventoryId = inventory.id;

  const orderInput = {
    userId,
    totalPrice: 10,
    items: [
      {
        productVariantId,
        quantity: 1,
        unitPrice: 10,
      },
    ],
  };

  const createdOrders = await Promise.all([
    orderService.createOrder(orderInput),
    orderService.createOrder(orderInput),
  ]);

  assert.equal(createdOrders.length, 2);

  const reservationResults = await Promise.allSettled(
    createdOrders.map(async (order) => {
      await inventoryPrisma.$transaction(async (tx) => {
        await inventoryApi.decrementStockForOrderItems(order.items, tx);
      });

      return await prisma.order.update({
        where: { id: order.id },
        data: { status: ORDER_STATUS.CONFIRMED },
        select: { id: true, status: true },
      });
    }),
  );

  const successfulReservations = reservationResults.filter(
    (result) =>
      result.status === "fulfilled" &&
      result.value.status === ORDER_STATUS.CONFIRMED,
  );

  assert.ok(
    successfulReservations.length <= 1,
    `expected at most one confirmed reservation, got ${successfulReservations.length}`,
  );

  const finalStock = await inventoryPrisma.productStock.findUniqueOrThrow({
    where: {
      productVariantId_inventoryId: {
        productVariantId,
        inventoryId,
      },
    },
    select: {
      stockLevel: true,
    },
  });

  assert.ok(
    finalStock.stockLevel >= 0,
    `expected stock never to go negative, got ${finalStock.stockLevel}`,
  );
});
