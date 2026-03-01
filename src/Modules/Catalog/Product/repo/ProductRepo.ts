import { PrismaClient } from "@prisma/client/extension";
import {
  AddProductInput,
  AddProductResponse,
  GetAllProductsResponse,
  ProductResponse,
  UpdateProductInput,
  UpdateProductResponse,
  DeleteProductResponse,
  GetProductByIdResponse,
} from "../types/types.js";
import { ProductRepo } from "./Repo.js";
import { prisma } from "../../../../shared/prisma.js";
export class ProductPostgreSqlRepo implements ProductRepo {
  getAllProducts = async (
    db: PrismaClient,
  ): Promise<GetAllProductsResponse[]> => {
    const products = await db.product.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        producer: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        variants: {
          select: {
            id: true,
            sku: true,
            color: true,
            size: true,
            weight: true,
            price: true,
            images: {
              select: {
                url: true,
                isPrimary: true,
                altText: true,
              },
            },
          },
        },
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
    return products;
  };

  getProductById = async (
    productId: string,
  ): Promise<GetProductByIdResponse | null> => {
    const product = await prisma.product.findUnique({
      where: { id: productId, deletedAt: null },
      select: {
        id: true,
        name: true,
        producer: true,
        isActive: true,
        deletedAt: true,
      },
    });
    return product;
  };

  addProduct = async (
    input: AddProductInput,
    db: PrismaClient,
  ): Promise<AddProductResponse> => {
    const product = await db.product.create({
      data: {
        name: input.name,
        producer: input.producer ?? undefined,
        categories: {
          createMany: {
            data: input.categories.map((id) => ({
              categoryId: id,
            })),
          },
        },
        variants: {
          create: input.variants.map((variant) => ({
            price: variant.price,
            sku: variant.sku,
            color: variant.color ?? undefined,
            size: variant.size ?? undefined,
            weight: variant.weight,
            images: {
              create: variant.images.map((img) => ({
                url: img.url,
                altText: img.altText,
                isPrimary: img.isPrimary,
              })),
            },
          })),
        },
      },
      select: {
        id: true,
        name: true,
        producer: true,
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        variants: {
          select: {
            productId: true,
            id: true,
          },
        },
      },
    });
    return product;
  };

  updateProduct = async (
    input: UpdateProductInput,
    db: PrismaClient,
  ): Promise<UpdateProductResponse> => {
    // Update product base info
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.producer !== undefined) updateData.producer = input.producer;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const product = await db.product.update({
      where: { id: input.productId },
      data: updateData,
      select: {
        id: true,
        name: true,
        producer: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Update variants if provided
    if (input.variants && input.variants.length > 0) {
      for (const variant of input.variants) {
        const variantUpdateData: any = {};
        if (variant.sku !== undefined) variantUpdateData.sku = variant.sku;
        if (variant.color !== undefined)
          variantUpdateData.color = variant.color;
        if (variant.size !== undefined) variantUpdateData.size = variant.size;
        if (variant.weight !== undefined)
          variantUpdateData.weight = variant.weight;
        if (variant.price !== undefined)
          variantUpdateData.price = variant.price;

        if (Object.keys(variantUpdateData).length > 0) {
          await db.productVariant.update({
            where: { id: variant.variantId },
            data: variantUpdateData,
          });
        }
      }
    }

    return product;
  };

  deleteProduct = async (
    productId: string,
    db: PrismaClient,
  ): Promise<DeleteProductResponse> => {
    const deletedAt = new Date();

    await db.product.update({
      where: { id: productId },
      data: { deletedAt },
    });

    return {
      id: productId,
      message: "Product soft deleted successfully",
      deletedAt,
    };
  };

  checkProductNameExists = async (name: string): Promise<boolean> => {
    const existingProduct = await prisma.product.findFirst({
      where: {
        name: name,
        deletedAt: null,
      },
    });

    return !!existingProduct;
  };

  checkSKUsExist = async (
    skus: string[],
  ): Promise<{ sku: string; productName: string }[]> => {
    const existingVariants = await prisma.productVariant.findMany({
      where: {
        sku: {
          in: skus,
        },
      },
      select: {
        sku: true,
        product: {
          select: {
            name: true,
          },
        },
      },
    });

    return existingVariants.map((v) => ({
      sku: v.sku,
      productName: v.product.name,
    }));
  };
}
