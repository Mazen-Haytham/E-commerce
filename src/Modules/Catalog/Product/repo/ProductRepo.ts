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
    const products = await prisma.product.findMany({
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
      where: { id: productId },
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
    const product = await prisma.product.create({
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
          createMany: {
            data: input.variants.map((variant) => ({
              price: variant.price,
              sku: variant.sku,
              color: variant.color ?? undefined,
              size: variant.size ?? undefined,
              weight: variant.weight,
            })),
          },
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

    const product = await prisma.product.update({
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
          await prisma.productVariant.update({
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

    await prisma.product.update({
      where: { id: productId },
      data: { deletedAt },
    });

    return {
      id: productId,
      message: "Product soft deleted successfully",
      deletedAt,
    };
  };
}
