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
} from "../Repo/Repo.js";
import { prisma } from "../../../src/shared/prisma.js";
import { userApi } from "../../User/src/Api/userApi.js";
import { ProductApi } from "../../Catalog/Product/API/productApi.js";
import { CategoryApi } from "../../Catalog/Category/API/categoryApi.js";

export class OrderService {
  private orderRepo: OrderRepo;
  private userApi: userApi;
  private productApi: ProductApi;
  private categoryApi: CategoryApi;

  constructor(
    orderRepo: OrderRepo,
    userApi: userApi,
    productApi: ProductApi,
    categoryApi: CategoryApi,
  ) {
    this.orderRepo = orderRepo;
    this.userApi = userApi;
    this.productApi = productApi;
    this.categoryApi = categoryApi;
  }

  getAllOrders = async (): Promise<GetAllOrdersResponse[]> => {
    return await this.orderRepo.getAllOrders(prisma);
  };

  getOrderById = async (orderId: string): Promise<GetOrderResponse | null> => {
    if (!orderId || orderId.trim() === "") {
      throw new Error("Order ID is required");
    }

    const order = await this.orderRepo.getOrderById(orderId);

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    return order;
  };

  getOrdersByUserId = async (
    userId: string,
  ): Promise<GetOrdersByUserResponse[]> => {
    if (!userId || userId.trim() === "") {
      throw new Error("User ID is required");
    }

    return await this.orderRepo.getOrdersByUserId(userId, prisma);
  };

  createOrder = async (
    input: CreateOrderInput,
  ): Promise<CreateOrderResponse> => {
    // Validate input
    if (!input.userId || input.userId.trim() === "") {
      throw new Error("User ID is required");
    }

    if (!input.items || input.items.length === 0) {
      throw new Error("At least one item is required in the order");
    }

    if (!input.totalPrice || Number(input.totalPrice) <= 0) {
      throw new Error("Total price must be greater than zero");
    }

    // Validate all items have required fields
    for (const item of input.items) {
      if (!item.productVariantId || item.productVariantId.trim() === "") {
        throw new Error("Product variant ID is required for all items");
      }

      if (!item.quantity || item.quantity <= 0) {
        throw new Error("Quantity must be greater than zero");
      }

      if (!item.unitPrice || Number(item.unitPrice) <= 0) {
        throw new Error("Unit price must be greater than zero");
      }
    }

    // Verify user exists using UserApi
    await this.userApi.findUserById(input.userId);

    // Verify all product variants exist using ProductApi
    for (const item of input.items) {
      await this.productApi.findProductVariantById(item.productVariantId);
    }

    return await this.orderRepo.createOrder(input, prisma);
  };

  updateOrderStatus = async (
    input: UpdateOrderStatusInput,
  ): Promise<UpdateOrderStatusResponse> => {
    if (!input.orderId || input.orderId.trim() === "") {
      throw new Error("Order ID is required");
    }

    if (!input.status || input.status.trim() === "") {
      throw new Error("Status is required");
    }

    // Validate status is one of allowed values
    const validStatuses = ["confirmed", "cancelled"];
    if (!validStatuses.includes(input.status)) {
      throw new Error(
        `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
      );
    }

    return await this.orderRepo.updateOrderStatus(input, prisma);
  };

  deleteOrder = async (orderId: string): Promise<DeleteOrderResponse> => {
    if (!orderId || orderId.trim() === "") {
      throw new Error("Order ID is required");
    }

    return await this.orderRepo.deleteOrder(orderId, prisma);
  };

  createPayment = async (
    input: CreatePaymentInput,
  ): Promise<CreatePaymentResponse> => {
    // Validate input
    if (!input.orderId || input.orderId.trim() === "") {
      throw new Error("Order ID is required");
    }

    if (!input.paymentMethodId || input.paymentMethodId.trim() === "") {
      throw new Error("Payment method ID is required");
    }

    if (!input.amount || Number(input.amount) <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    // Verify order exists and is confirmed
    const order = await this.orderRepo.findOrderById(input.orderId);

    if (!order) {
      throw new Error(`Order with ID ${input.orderId} not found`);
    }

    if (order.status !== "confirmed") {
      throw new Error(
        `Cannot create payment for order with status "${order.status}". Only confirmed orders can have payments.`,
      );
    }

    // Verify payment method exists
    const paymentMethodExists = await this.orderRepo.findPaymentMethodById(
      input.paymentMethodId,
    );

    if (!paymentMethodExists) {
      throw new Error(
        `Payment method with ID ${input.paymentMethodId} not found`,
      );
    }

    return await this.orderRepo.createPayment(input, prisma);
  };

  getPaymentsByOrderId = async (
    orderId: string,
  ): Promise<CreatePaymentResponse[]> => {
    if (!orderId || orderId.trim() === "") {
      throw new Error("Order ID is required");
    }

    // Verify order exists using OrderRepo
    await this.orderRepo.findOrderById(orderId);

    return await this.orderRepo.getPaymentsByOrderId(orderId);
  };

  // Pricing/Discount Methods

  getPricingByProductId = async (
    productId: string,
  ): Promise<GetPricingResponse | null> => {
    if (!productId || productId.trim() === "") {
      throw new Error("Product ID is required");
    }

    // Verify product exists using ProductApi
    await this.productApi.findProductById(productId);

    return await this.orderRepo.getPricingByProductId(productId);
  };

  getPricingByProductVariantId = async (
    variantId: string,
  ): Promise<GetPricingResponse | null> => {
    if (!variantId || variantId.trim() === "") {
      throw new Error("Variant ID is required");
    }

    // Verify variant exists using ProductApi
    await this.productApi.findProductVariantById(variantId);

    return await this.orderRepo.getPricingByProductVariantId(variantId);
  };

  getPricingByCategoryId = async (
    categoryId: string,
  ): Promise<GetPricingResponse | null> => {
    if (!categoryId || categoryId.trim() === "") {
      throw new Error("Category ID is required");
    }

    // Verify category exists using CategoryApi
    await this.categoryApi.findCategoryById(categoryId);

    return await this.orderRepo.getPricingByCategoryId(categoryId);
  };

  calculateOrderDiscount = async (
    orderId: string,
  ): Promise<OrderDiscountResponse | null> => {
    if (!orderId || orderId.trim() === "") {
      throw new Error("Order ID is required");
    }

    // Verify order exists using OrderRepo
    await this.orderRepo.findOrderById(orderId);

    return await this.orderRepo.calculateOrderDiscount(orderId);
  };

  createVariantDiscount = async (
    input: CreateVariantDiscountInput,
  ): Promise<CreateDiscountResponse> => {
    // Validate input
    if (!input.productVariantId || input.productVariantId.trim() === "") {
      throw new Error("Product variant ID is required");
    }

    if (
      !input.discountType ||
      !["percentage", "fixed_amount"].includes(input.discountType)
    ) {
      throw new Error(
        'Discount type must be either "percentage" or "fixed_amount"',
      );
    }

    if (input.discountValue <= 0) {
      throw new Error("Discount value must be greater than zero");
    }

    if (input.discountType === "percentage" && input.discountValue > 100) {
      throw new Error("Percentage discount cannot exceed 100");
    }

    // Verify variant exists
    await this.productApi.findProductVariantById(input.productVariantId);

    return await this.orderRepo.createVariantDiscount(input);
  };

  createCategoryDiscount = async (
    input: CreateCategoryDiscountInput,
  ): Promise<CreateDiscountResponse> => {
    // Validate input
    if (!input.categoryId || input.categoryId.trim() === "") {
      throw new Error("Category ID is required");
    }

    if (
      !input.discountType ||
      !["percentage", "fixed_amount"].includes(input.discountType)
    ) {
      throw new Error(
        'Discount type must be either "percentage" or "fixed_amount"',
      );
    }

    if (input.discountValue <= 0) {
      throw new Error("Discount value must be greater than zero");
    }

    if (input.discountType === "percentage" && input.discountValue > 100) {
      throw new Error("Percentage discount cannot exceed 100");
    }

    // Verify category exists
    await this.categoryApi.findCategoryById(input.categoryId);

    return await this.orderRepo.createCategoryDiscount(input);
  };
}
