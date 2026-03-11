import { ProductRepo } from "../repo/Repo.js";
import {
  AddProductInput,
  AddProductResponse,
  GetAllProductsResponse,
  UpdateProductInput,
  UpdateProductResponse,
  DeleteProductResponse,
  cursorData,
  PaginatedProducts
} from "../types/types.js";
import { prisma } from "../../../../shared/prisma.js";
import { PrismaClient } from "@prisma/client/extension";
import { addProductVariantInInventoryInput } from "../../../Inventory/types/types.js";
import { InventoryApi } from "../../../Inventory/Api/InvApi.js";
import { AppError } from "../../../../utils/AppError.js";

export class ProductService {
  constructor(
    private readonly productRepo: ProductRepo,
    private readonly inventoryApi: InventoryApi,
  ) {}

  getAllProducts = async (
  limit: number,
  cursor?: string,
): Promise<PaginatedProducts> => {

  const take: number = limit + 1;

  // Decode cursor if exists
  let cursorData: { createdAt: Date; id: string } | undefined;
  if (cursor) {
    const decoded = JSON.parse(
      Buffer.from(cursor, "base64").toString("utf8")
    );

    cursorData = {
      createdAt: new Date(decoded.createdAt),
      id: decoded.id,
    };
  }

  // Fetch products from repo
  const products = await this.productRepo.getAllProducts(
    prisma,
    take,
    cursorData
  );

  if (!products || products.length === 0) {
    throw new AppError("No products found", 404);
  }

  // Filter active products with variants
  const validProducts = products.filter(product => 
    product.isActive && product.variants && product.variants.length > 0
  );

  if (validProducts.length === 0) {
    throw new AppError("No active products with variants found", 404);
  }

  // Determine if there is another page
  const hasMore = validProducts.length > limit;
  const items = hasMore ? validProducts.slice(0, limit) : validProducts;

  // Generate nextCursor
  let nextCursor: string | null = null;
  if (hasMore) {
    const lastProduct = items[items.length - 1];
    nextCursor = Buffer.from(
      JSON.stringify({ createdAt: lastProduct.createdAt, id: lastProduct.id })
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
        tx as PrismaClient,
      );

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

      // Add variants to inventory if there are inventory entries
      if (inventoryInputs.length > 0) {
        await this.inventoryApi.addProductVariantInInventory(inventoryInputs);
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

    // Validation: Ensure at least one field is provided for update
    if (
      input.name === undefined &&
      input.producer === undefined &&
      input.isActive === undefined &&
      (!input.variants || input.variants.length === 0)
    ) {
      throw new AppError("At least one field must be provided for update", 400);
    }

    return await this.productRepo.updateProduct(input, prisma);
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

    return await this.productRepo.deleteProduct(productId, prisma);
  };

  getProductById = async (productId: string) => {
    if (!productId || productId.trim() === "") {
      throw new AppError("Product ID is required", 400);
    }

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

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new AppError("Product variant not found", 404);
    }

    return variant;
  };
}
