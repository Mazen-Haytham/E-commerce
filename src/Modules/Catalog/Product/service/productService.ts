import { ProductRepo } from "../repo/Repo.js";
import {
  AddProductInput,
  AddProductResponse,
  GetAllProductsResponse,
  UpdateProductInput,
  UpdateProductResponse,
  DeleteProductResponse,
  cursorData,
  PaginatedProducts,
} from "../types/types.js";
import { redis } from "../../../../shared/redis.js";
import { prisma } from "../../../../shared/prisma.js";
import { inventoryPrisma } from "../../../../shared/inventoryPrisma.js";
import { PrismaClient } from "@prisma/client/extension";
import { addProductVariantInInventoryInput } from "../../../Inventory/types/types.js";
import { InventoryApi } from "../../../Inventory/Api/InvApi.js";
import { AppError } from "../../../../utils/AppError.js";

export class ProductService {
  constructor(
    private readonly productRepo: ProductRepo,
    private readonly inventoryApi: InventoryApi,
  ) {}
  getCache = async (cacheKey: string) => {
    try {
      const result = await redis.get(cacheKey);
      return result;
    } catch (error) {
      console.error(`Redis is Down (ignored) `, error);
      return null;
    }
  };
  setCache = async (cacheKey: string, data: any, ttl: number = 60) => {
    try {
      await redis.set(cacheKey, JSON.stringify(data), "EX", ttl);
    } catch (error) {
      console.error(`Redis is Down (ignored) `, error);
    }
  };
  deleteCache = async (cacheKey: string) => {
    try {
      await redis.del(cacheKey);
    } catch (error) {
      console.error(`Redis Delete failed ${error}`);
      return null;
    }
  };
  sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  getAllProducts = async (
    limit: number,
    cursor?: string,
  ): Promise<PaginatedProducts> => {
    const take = limit + 1;

    const listCacheKey = `products:list:${cursor || "start"}:${limit}`;

    // =========================
    // 1. TRY CACHE (LIST OF IDS)
    // =========================
    const cachedIdsRaw = await redis.get(listCacheKey);

    if (cachedIdsRaw) {
      console.log("[CACHE] HIT list");

      const ids: string[] = JSON.parse(cachedIdsRaw);

      const keys = ids.map((id) => `product:${id}`);

      // =========================
      // 2. BULK FETCH PRODUCTS
      // =========================
      const cachedProducts = await redis.mget(keys);

      let products: any[] = [];
      let missingIds: string[] = [];

      cachedProducts.forEach((p: any, index: number) => {
        if (p) {
          products.push(JSON.parse(p));
        } else {
          missingIds.push(ids[index]);
        }
      });

      // =========================
      // 3. IF PARTIAL MISS → REFILL
      // =========================
      if (missingIds.length > 0) {
        console.log("[CACHE] PARTIAL MISS → DB fallback for missing");

        const missingProducts =
          await this.productRepo.getProductsByIds(missingIds);

        // cache missing (PIPELINE)
        const pipeline = redis.pipeline();

        missingProducts.forEach((p: any) => {
          pipeline.set(`product:${p.id}`, JSON.stringify(p), "EX", 180);
        });

        await pipeline.exec();

        products = [...products, ...missingProducts];
      }

      // =========================
      // 4. RESTORE ORDER
      // =========================
      const productMap = new Map(products.map((p) => [p.id, p]));

      const ordered = ids.map((id) => productMap.get(id)).filter(Boolean);

      // =========================
      // 5. PAGINATION
      // =========================
      const hasMore = ordered.length > limit;
      const items = hasMore ? ordered.slice(0, limit) : ordered;

      let nextCursor: string | null = null;

      if (hasMore) {
        const last = items[items.length - 1];

        nextCursor = Buffer.from(
          JSON.stringify({
            createdAt: last.createdAt,
            id: last.id,
          }),
        ).toString("base64");
      }

      return {
        data: items,
        nextCursor,
      };
    }

    // =========================
    // 6. CACHE MISS → DB FALLBACK
    // =========================
    console.log("[CACHE] MISS list → DB");

    let cursorData: { createdAt: Date; id: string } | undefined;

    if (cursor) {
      const decoded = JSON.parse(
        Buffer.from(cursor, "base64").toString("utf8"),
      );

      cursorData = {
        createdAt: new Date(decoded.createdAt),
        id: decoded.id,
      };
    }

    const products = await this.productRepo.getAllProducts(
      prisma,
      take,
      cursorData,
    );

    if (!products || products.length === 0) {
      throw new AppError("No products found", 404);
    }

    const validProducts = products.filter(
      (p) => p.isActive && p.variants?.length > 0,
    );

    if (validProducts.length === 0) {
      throw new AppError("No active products with variants found", 404);
    }

    const hasMore = validProducts.length > limit;
    const items = hasMore ? validProducts.slice(0, limit) : validProducts;

    // =========================
    // 7. CACHE EVERYTHING
    // =========================

    const ids = items.map((p) => p.id);

    await redis.set(listCacheKey, JSON.stringify(ids), "EX", 60);

    const pipeline = redis.pipeline();

    items.forEach((p) => {
      pipeline.set(`product:${p.id}`, JSON.stringify(p), "EX", 180);
    });

    await pipeline.exec();

    // =========================
    // 8. NEXT CURSOR
    // =========================
    let nextCursor: string | null = null;

    if (hasMore) {
      const last = items[items.length - 1];

      nextCursor = Buffer.from(
        JSON.stringify({
          createdAt: last.createdAt,
          id: last.id,
        }),
      ).toString("base64");
    }

    return {
      data: items,
      nextCursor,
    };
  };

  addProduct = async (input: AddProductInput): Promise<AddProductResponse> => {
    // Validation: Check if product with same name already exists
    const productNameExists = await this.productRepo.checkProductNameExists(
      input.name,
    );

    if (productNameExists) {
      throw new AppError(
        `Product with name "${input.name}" already exists`,
        409,
      );
    }

    // Validation: Check if any variant SKU already exists
    const skus = input.variants.map((variant) => variant.sku);
    const existingVariants = await this.productRepo.checkSKUsExist(skus);

    if (existingVariants.length > 0) {
      const duplicateSKUs = existingVariants
        .map((v) => `"${v.sku}" (product: ${v.productName})`)
        .join(", ");
      throw new AppError(`Variant SKU(s) already exist: ${duplicateSKUs}`, 409);
    }

    return await prisma.$transaction(async (tx) => {
      // Add product to database
      const product: AddProductResponse = await this.productRepo.addProduct(
        input,
        tx,
      );
      console.log(product);

      // Map product variants to inventory input
      const inventoryInputs: addProductVariantInInventoryInput[] = [];

      for (let i = 0; i < product.variants.length; i++) {
        const variant = product.variants[i];
        const inventoriesFromInput = input.variants[i].inventories;

        // Create inventory entries for each variant
        for (const inventory of inventoriesFromInput) {
          inventoryInputs.push({
            productVariantId: variant.id,
            inventoryId: inventory.id,
            stockLevel: inventory.stockLevel,
            restockAlert: inventory.restock,
          });
        }
      }
      console.log(inventoryInputs);

      // Add variants to inventory if there are inventory entries
      try {
        // ... existing code ...
        if (inventoryInputs.length > 0) {
          await this.inventoryApi.addProductVariantInInventory(
            inventoryInputs,
            inventoryPrisma,
          );
        }
      } catch (error) {
        console.error("Transaction error details:", error);
        throw error;
      }
      try {
        await redis.delPattern("products:list:*");
      } catch (redisError) {
        console.error("❌ Redis error (ignoring):", redisError);
        // Don't throw - redis failure shouldn't rollback transaction
      }
      return product;
    });
  };

  updateProduct = async (
    input: UpdateProductInput,
  ): Promise<UpdateProductResponse> => {
    // Validation: Check if product exists and is not deleted
    const existingProduct = await this.getProductById(input.productId);

    if (!existingProduct || existingProduct.deletedAt !== null) {
      throw new AppError("Product not found or has been deleted", 404);
    }
    const productCacheKey = `product:${input.productId}`;
    // Validation: Ensure at least one field is provided for update
    if (
      input.name === undefined &&
      input.producer === undefined &&
      input.isActive === undefined &&
      (!input.variants || input.variants.length === 0)
    ) {
      throw new AppError("At least one field must be provided for update", 400);
    }
    const result = await this.productRepo.updateProduct(input, prisma);
    await this.deleteCache(productCacheKey);
    const variants = input.variants;
    if (variants) {
      await Promise.all(
        variants.map((variant) =>
          this.deleteCache(`productVariant:${variant.variantId}`),
        ),
      );
    }
    await redis.delPattern("products:list:*");
    return result;
  };

  deleteProduct = async (productId: string): Promise<DeleteProductResponse> => {
    // Validation: Check if product exists and is not already deleted
    const existingProduct = await this.productRepo.getProductById(productId);

    if (!existingProduct) {
      throw new AppError("Product not found", 404);
    }

    if (existingProduct.deletedAt !== null) {
      throw new AppError("Product is already deleted", 410);
    }
    const cacheKey = `product:${productId}`;
    const result = await this.productRepo.deleteProduct(productId, prisma);
    await this.deleteCache(cacheKey);
    await redis.delPattern("products:list:*");
    return result;
  };

  getProductById = async (productId: string) => {
    if (!productId || productId.trim() === "") {
      throw new AppError("Product ID is required", 400);
    }
    const cacheKey = `product:${productId}`;
    const cachedProduct = await this.getCache(cacheKey);
    if (cachedProduct) {
      console.log(`Cache Hit 🔥`);
      return JSON.parse(cachedProduct);
    }
    console.log(`Cache Miss 💔`);
    const lockKey = `lock:${cacheKey}`;
    const lockAcquired = await redis.set(lockKey, "1", "NX", "EX", 5);
    if (lockAcquired) {
      try {
        const product = await this.productRepo.getProductById(productId);

        if (!product) {
          throw new AppError("Product not found", 404);
        }
        await this.setCache(cacheKey, product, 180);
        return product;
      } finally {
        await this.deleteCache(lockKey);
      }
    }

    // 3. Retry mechanism (wait for leader to populate cache)
    for (let i = 0; i < 5; i++) {
      await this.sleep(100);

      const retryCache = await this.getCache(cacheKey);

      if (retryCache) {
        console.log("Cache filled by another request 🎉");
        return JSON.parse(retryCache);
      }
    }

    // 4. Fallback (rare edge case)
    console.log("Fallback → DB hit");

    const product = await this.productRepo.getProductById(productId);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product;
  };

  getProductVariantById = async (variantId: string) => {
    if (!variantId || variantId.trim() === "") {
      throw new AppError("Product Variant ID is required", 400);
    }
    const cacheKey = `productVariant:${variantId}`;
    const cachedProductVariant = await this.getCache(cacheKey);
    if (cachedProductVariant) {
      console.log(`Cache Hit 🔥`);
      return JSON.parse(cachedProductVariant);
    }
    const variant = await this.productRepo.getProductVariantById(variantId);

    if (!variant) {
      throw new AppError("Product variant not found", 404);
    }
    console.log(`Cache Miss 💔`);
    await this.setCache(cacheKey, variant, 180);
    return variant;
  };
}
