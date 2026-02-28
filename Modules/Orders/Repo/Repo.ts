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

export interface GetPricingResponse {
  id: string;
  originalPrice: number;
  discountType?: "percentage" | "fixed_amount";
  discountValue?: number;
  finalPrice: number;
  startDate?: Date;
  endDate?: Date;
}

export interface OrderDiscountResponse {
  orderId: string;
  originalTotal: any;
  discountAmount: any;
  discountType: string;
  finalTotal: any;
}

export interface OrderRepo {
  // Order Operations
  getAllOrders(db: PrismaClient): Promise<GetAllOrdersResponse[]>;
  getOrderById(orderId: string): Promise<GetOrderResponse | null>;
  getOrdersByUserId(
    userId: string,
    db: PrismaClient,
  ): Promise<GetOrdersByUserResponse[]>;
  createOrder(
    input: CreateOrderInput,
    db: PrismaClient,
  ): Promise<CreateOrderResponse>;
  updateOrderStatus(
    input: UpdateOrderStatusInput,
    db: PrismaClient,
  ): Promise<UpdateOrderStatusResponse>;
  deleteOrder(orderId: string, db: PrismaClient): Promise<DeleteOrderResponse>;
  findOrderById(orderId: string): Promise<GetOrderResponse | null>;

  // Payment Operations
  createPayment(
    input: CreatePaymentInput,
    db: PrismaClient,
  ): Promise<CreatePaymentResponse>;
  getPaymentsByOrderId(orderId: string): Promise<CreatePaymentResponse[]>;
  findPaymentMethodById(paymentMethodId: string): Promise<boolean>;

  // Pricing/Discount Operations
  getPricingByProductId(productId: string): Promise<GetPricingResponse | null>;
  getPricingByProductVariantId(
    variantId: string,
  ): Promise<GetPricingResponse | null>;
  getPricingByCategoryId(
    categoryId: string,
  ): Promise<GetPricingResponse | null>;
  calculateOrderDiscount(
    orderId: string,
  ): Promise<OrderDiscountResponse | null>;
  createVariantDiscount(
    input: CreateVariantDiscountInput,
  ): Promise<CreateDiscountResponse>;
  createCategoryDiscount(
    input: CreateCategoryDiscountInput,
  ): Promise<CreateDiscountResponse>;
}
