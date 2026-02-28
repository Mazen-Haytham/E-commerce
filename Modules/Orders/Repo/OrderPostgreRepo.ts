import { PrismaClient } from "@prisma/client/extension";
import {
  CreateOrderInput,
  CreateOrderResponse,
  GetOrderResponse,
  GetAllOrdersResponse,
  UpdateOrderStatusInput,
  UpdateOrderStatusResponse,
  DeleteOrderResponse,
  GetOrdersByUserResponse,
  CreatePaymentInput,
  CreatePaymentResponse,
  CreateVariantDiscountInput,
  CreateCategoryDiscountInput,
  CreateDiscountResponse,
} from "../types/types.js";
import {
  OrderRepo,
  GetPricingResponse,
  OrderDiscountResponse,
} from "./Repo.js";
import { prisma } from "../../../src/shared/prisma.js";

export class OrderPostgreSqlRepo implements OrderRepo {
  getAllOrders = async (db: PrismaClient): Promise<GetAllOrdersResponse[]> => {
    const orders = await db.order.findMany({
      select: {
        id: true,
        userId: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return orders.map((order: any) => ({
      id: order.id,
      userId: order.userId,
      totalPrice: order.totalPrice,
      status: order.status,
      itemCount: order.items.length,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));
  };

  getOrderById = async (orderId: string): Promise<GetOrderResponse | null> => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            orderId: true,
            productVariantId: true,
            quantity: true,
            unitPrice: true,
          },
        },
        payments: {
          select: {
            id: true,
            orderId: true,
            paymentMethodId: true,
            amount: true,
            transactionId: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    return order;
  };

  getOrdersByUserId = async (
    userId: string,
    db: PrismaClient,
  ): Promise<GetOrdersByUserResponse[]> => {
    const orders = await db.order.findMany({
      where: { userId },
      select: {
        id: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        items: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return orders.map((order: any) => ({
      id: order.id,
      totalPrice: order.totalPrice,
      status: order.status,
      itemCount: order.items.length,
      createdAt: order.createdAt,
    }));
  };

  createOrder = async (
    input: CreateOrderInput,
    db: PrismaClient,
  ): Promise<CreateOrderResponse> => {
    const order = await db.order.create({
      data: {
        userId: input.userId,
        totalPrice: input.totalPrice,
        status: "confirmed",
        items: {
          createMany: {
            data: input.items.map((item: any) => ({
              productVariantId: item.productVariantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
      },
      select: {
        id: true,
        userId: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            orderId: true,
            productVariantId: true,
            quantity: true,
            unitPrice: true,
          },
        },
      },
    });

    return order;
  };

  updateOrderStatus = async (
    input: UpdateOrderStatusInput,
    db: PrismaClient,
  ): Promise<UpdateOrderStatusResponse> => {
    // If status is "cancelled", validate transition is allowed
    if (input.status === "cancelled") {
      const order = await db.order.findUnique({
        where: { id: input.orderId },
        select: { status: true },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // Only allow cancellation from "confirmed" status
      if (order.status !== "confirmed") {
        throw new Error(
          `Cannot cancel order with status "${order.status}". Only confirmed orders can be cancelled.`,
        );
      }
    }

    const updatedOrder = await db.order.update({
      where: { id: input.orderId },
      data: { status: input.status },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    return updatedOrder;
  };

  deleteOrder = async (
    orderId: string,
    db: PrismaClient,
  ): Promise<DeleteOrderResponse> => {
    // For orders, we might want to mark as cancelled instead of soft delete
    // But if you really want soft delete with deletedAt field, add it to schema first
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Mark as cancelled instead of deleting
    const cancelledOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "cancelled" },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    return {
      id: cancelledOrder.id,
      message: "Order cancelled successfully",
      deletedAt: cancelledOrder.updatedAt,
    };
  };

  createPayment = async (
    input: CreatePaymentInput,
    db: PrismaClient,
  ): Promise<CreatePaymentResponse> => {
    const payment = await db.payment.create({
      data: {
        orderId: input.orderId,
        paymentMethodId: input.paymentMethodId,
        amount: input.amount,
        transactionId: input.transactionId,
        status: "succeeded",
      },
      select: {
        id: true,
        orderId: true,
        paymentMethodId: true,
        amount: true,
        transactionId: true,
        status: true,
        createdAt: true,
      },
    });

    return payment;
  };

  getPaymentsByOrderId = async (
    orderId: string,
  ): Promise<CreatePaymentResponse[]> => {
    const payments = await prisma.payment.findMany({
      where: { orderId },
      select: {
        id: true,
        orderId: true,
        paymentMethodId: true,
        amount: true,
        transactionId: true,
        status: true,
        createdAt: true,
      },
    });

    return payments;
  };

  findOrderById = async (orderId: string): Promise<GetOrderResponse | null> => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            orderId: true,
            productVariantId: true,
            quantity: true,
            unitPrice: true,
          },
        },
        payments: {
          select: {
            id: true,
            orderId: true,
            paymentMethodId: true,
            amount: true,
            transactionId: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    return order;
  };

  findPaymentMethodById = async (paymentMethodId: string): Promise<boolean> => {
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    return !!paymentMethod;
  };

  // Pricing/Discount Methods

  getPricingByProductId = async (
    productId: string,
  ): Promise<GetPricingResponse | null> => {
    const now = new Date();
    const pricing = await prisma.pricing.findFirst({
      where: {
        productId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: {
        id: true,
        discountType: true,
        discountValue: true,
        startDate: true,
        endDate: true,
      },
    });

    return pricing as GetPricingResponse | null;
  };

  getPricingByProductVariantId = async (
    variantId: string,
  ): Promise<GetPricingResponse | null> => {
    const now = new Date();
    const pricing = await prisma.pricing.findFirst({
      where: {
        productVariantId: variantId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: {
        id: true,
        discountType: true,
        discountValue: true,
        startDate: true,
        endDate: true,
      },
    });

    return pricing as GetPricingResponse | null;
  };

  getPricingByCategoryId = async (
    categoryId: string,
  ): Promise<GetPricingResponse | null> => {
    const now = new Date();
    const pricing = await prisma.pricing.findFirst({
      where: {
        categoryId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: {
        id: true,
        discountType: true,
        discountValue: true,
        startDate: true,
        endDate: true,
      },
    });

    return pricing as GetPricingResponse | null;
  };

  calculateOrderDiscount = async (
    orderId: string,
  ): Promise<OrderDiscountResponse | null> => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        totalPrice: true,
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            productVariant: {
              select: {
                id: true,
                product: {
                  select: {
                    id: true,
                    categories: {
                      select: {
                        category: {
                          select: {
                            id: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    let totalDiscount = 0;
    let discountType = "";

    // Check pricing for each item in the order
    for (const item of order.items) {
      // Check variant pricing first
      let variantPricing = await this.getPricingByProductVariantId(
        item.productVariant.id,
      );

      if (variantPricing) {
        const itemTotal = Number(item.unitPrice) * item.quantity;
        if (variantPricing.discountType === "percentage") {
          totalDiscount +=
            itemTotal * (Number(variantPricing.discountValue) / 100);
        } else {
          totalDiscount += Number(variantPricing.discountValue) * item.quantity;
        }
        if (variantPricing.discountType) {
          discountType = variantPricing.discountType;
        }
        continue;
      }

      // Check product pricing
      let productPricing = await this.getPricingByProductId(
        item.productVariant.product.id,
      );

      if (productPricing) {
        const itemTotal = Number(item.unitPrice) * item.quantity;
        if (productPricing.discountType === "percentage") {
          totalDiscount +=
            itemTotal * (Number(productPricing.discountValue) / 100);
        } else {
          totalDiscount += Number(productPricing.discountValue) * item.quantity;
        }
        if (productPricing.discountType) {
          discountType = productPricing.discountType;
        }
        continue;
      }

      // Check category pricing
      const categories = item.productVariant.product.categories;
      if (categories.length > 0) {
        let categoryPricing = await this.getPricingByCategoryId(
          categories[0].category.id,
        );

        if (categoryPricing) {
          const itemTotal = Number(item.unitPrice) * item.quantity;
          if (categoryPricing.discountType === "percentage") {
            totalDiscount +=
              itemTotal * (Number(categoryPricing.discountValue) / 100);
          } else {
            totalDiscount +=
              Number(categoryPricing.discountValue) * item.quantity;
          }
          if (categoryPricing.discountType) {
            discountType = categoryPricing.discountType;
          }
        }
      }
    }

    const finalTotal = Number(order.totalPrice) - totalDiscount;

    return {
      orderId: order.id,
      originalTotal: order.totalPrice,
      discountAmount: totalDiscount,
      discountType,
      finalTotal,
    };
  };

  createVariantDiscount = async (
    input: CreateVariantDiscountInput,
  ): Promise<CreateDiscountResponse> => {
    const pricing = await prisma.pricing.create({
      data: {
        productVariantId: input.productVariantId,
        discountType: input.discountType,
        discountValue: input.discountValue,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from now
      },
    });

    return {
      id: pricing.id,
      discountType: pricing.discountType as "percentage" | "fixed_amount",
      discountValue: Number(pricing.discountValue),
      createdAt: pricing.startDate,
    };
  };

  createCategoryDiscount = async (
    input: CreateCategoryDiscountInput,
  ): Promise<CreateDiscountResponse> => {
    const pricing = await prisma.pricing.create({
      data: {
        categoryId: input.categoryId,
        discountType: input.discountType,
        discountValue: input.discountValue,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from now
      },
    });

    return {
      id: pricing.id,
      discountType: pricing.discountType as "percentage" | "fixed_amount",
      discountValue: Number(pricing.discountValue),
      createdAt: pricing.startDate,
    };
  };
}
