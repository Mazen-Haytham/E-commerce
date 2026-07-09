import { PrismaClient } from "@prisma/client/extension";
import { randomUUID } from "crypto";
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
  ORDER_STATUS,
} from "../types/types.js";
import {
  OrderRepo,
  GetPricingResponse,
  OrderDiscountResponse,
} from "../Repo/Repo.js";
import { prisma } from "../../../shared/prisma.js";
import { userApi } from "../../User/src/Api/userApi.js";
import { ProductApi } from "../../Catalog/Product/API/productApi.js";
import { CategoryApi } from "../../Catalog/Category/API/categoryApi.js";
import { InventoryApi } from "../../Inventory/Api/InvApi.js";
import { AppError } from "../../../utils/AppError.js";
import { OutboxRepo } from "../../../shared/outbox/outboxRepo.js";
import {
  ORDER_CREATED_EVENT_TYPE,
  OrderCreatedPayload,
  PendingOrderCreatedEvent,
} from "../events/orderCreatedEvent.js";
import {
  ORDER_CANCELLED_EVENT_TYPE,
  OrderCancelledPayload,
  PendingOrderCancelledEvent,
} from "../events/orderCancelledEvent.js";
import { publishEnvelope } from "../../../messaging/publisher.js";
import { ROUTING_KEYS } from "../../../shared/exchnage.js";

export class OrderService {
  private orderRepo: OrderRepo;
  private userApi: userApi;
  private productApi: ProductApi;
  private categoryApi: CategoryApi;
  private inventoryApi: InventoryApi;
  private outboxRepo: OutboxRepo;

  constructor(
    orderRepo: OrderRepo,
    userApi: userApi,
    productApi: ProductApi,
    categoryApi: CategoryApi,
    inventoryApi: InventoryApi,
    outboxRepo: OutboxRepo = new OutboxRepo(),
  ) {
    this.orderRepo = orderRepo;
    this.userApi = userApi;
    this.productApi = productApi;
    this.categoryApi = categoryApi;
    this.inventoryApi = inventoryApi;
    this.outboxRepo = outboxRepo;
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
    if (!input.userId || input.userId.trim() === "") {
      throw new AppError("User ID is required", 400);
    }

    if (!input.items || input.items.length === 0) {
      throw new AppError("At least one item is required in the order", 400);
    }

    if (!input.totalPrice || Number(input.totalPrice) <= 0) {
      throw new AppError("Total price must be greater than zero", 400);
    }

    // Validate all items have required fields
    for (const item of input.items) {
      if (!item.productVariantId || item.productVariantId.trim() === "") {
        throw new AppError("Product variant ID is required for all items", 400);
      }

      if (!item.quantity || item.quantity <= 0) {
        throw new AppError("Quantity must be greater than zero", 400);
      }

      if (!item.unitPrice || Number(item.unitPrice) <= 0) {
        throw new AppError("Unit price must be greater than zero", 400);
      }
    }

    // Verify user exists using UserApi
    await this.userApi.findUserById(input.userId);

    // Verify all product variants exist using ProductApi
    for (const item of input.items) {
      await this.productApi.findProductVariantById(item.productVariantId);
    }

    const { createdOrder, pendingEvent } = await prisma.$transaction(
      async (tx) => {
        const createdOrder = await this.orderRepo.createOrder(input, tx);

        const eventId = randomUUID();
        const occurredAt = new Date().toISOString();
        const payload: OrderCreatedPayload = {
          orderId: createdOrder.id,
          userId: createdOrder.userId,
          items: input.items.map((item) => ({
            productVariantId: item.productVariantId,
            quantity: item.quantity,
          })),
        };

        await this.outboxRepo.insertEvent(tx, {
          eventId,
          aggregateId: createdOrder.id,
          aggregateType: "Order",
          eventType: ORDER_CREATED_EVENT_TYPE,
          payload,
        });

        return {
          createdOrder,
          pendingEvent: { eventId, occurredAt, payload },
        };
      },
    );

    await this.tryPublishOrderCreatedEvent(pendingEvent);

    return createdOrder;
  };

  private tryPublishOrderCreatedEvent = async (
    pendingEvent: PendingOrderCreatedEvent,
  ): Promise<void> => {
    try {
      await publishEnvelope(ROUTING_KEYS.ORDER_CREATED, {
        eventId: pendingEvent.eventId,
        eventType: ORDER_CREATED_EVENT_TYPE,
        occurredAt: pendingEvent.occurredAt,
        payload: pendingEvent.payload,
      });
      await this.outboxRepo.markPublished(pendingEvent.eventId);
    } catch (err) {
      console.error(
        "[OrderService] failed to publish OrderCreated event; outbox row retained for relay",
        { eventId: pendingEvent.eventId, err },
      );
    }
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
    const validStatuses: string[] = [
      ORDER_STATUS.PENDING,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.STOCK_REJECTED,
      ORDER_STATUS.CANCELLED,
    ];
    if (!validStatuses.includes(input.status)) {
      throw new Error(
        `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
      );
    }

    return await this.orderRepo.updateOrderStatus(input, prisma);
  };

  cancelOrder = async (
    orderId: string,
  ): Promise<UpdateOrderStatusResponse> => {
    if (!orderId || orderId.trim() === "") {
      throw new Error("Order ID is required");
    }

    const { updatedOrder, pendingEvent } = await prisma.$transaction(
      async (tx) => {
        // Get current order to know its previous status
        const currentOrder = await this.orderRepo.findOrderStatusById(orderId, tx);

        if (!currentOrder) {
          throw new Error(`Order with ID ${orderId} not found`);
        }

        const previousStatus = currentOrder.status;

        // Update status (this will enforce valid transitions)
        const updatedOrder = await this.orderRepo.updateOrderStatus(
          { orderId, status: ORDER_STATUS.CANCELLED },
          tx,
        );

        // Write outbox event
        const eventId = randomUUID();
        const occurredAt = new Date().toISOString();
        const payload: OrderCancelledPayload = {
          orderId,
          previousStatus,
          items: currentOrder.items,
        };

        await this.outboxRepo.insertEvent(tx, {
          eventId,
          aggregateId: orderId,
          aggregateType: "Order",
          eventType: ORDER_CANCELLED_EVENT_TYPE,
          payload,
        });

        return {
          updatedOrder,
          pendingEvent: { eventId, occurredAt, payload },
        };
      },
    );

    await this.tryPublishOrderCancelledEvent(pendingEvent);

    return updatedOrder;
  };

  private tryPublishOrderCancelledEvent = async (
    pendingEvent: PendingOrderCancelledEvent,
  ): Promise<void> => {
    try {
      await publishEnvelope(ROUTING_KEYS.ORDER_CANCELLED, {
        eventId: pendingEvent.eventId,
        eventType: ORDER_CANCELLED_EVENT_TYPE,
        occurredAt: pendingEvent.occurredAt,
        payload: pendingEvent.payload,
      });
      await this.outboxRepo.markPublished(pendingEvent.eventId);
    } catch (err) {
      console.error(
        "[OrderService] failed to publish OrderCancelled event; outbox row retained for relay",
        { eventId: pendingEvent.eventId, err },
      );
    }
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

    if (order.status !== ORDER_STATUS.CONFIRMED) {
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
