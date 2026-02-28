import { Request, Response, NextFunction } from "express";
import { OrderService } from "../Service/OrderService.js";
import {
  CreateOrderInput,
  UpdateOrderStatusInput,
  CreatePaymentInput,
  CreateVariantDiscountInput,
  CreateCategoryDiscountInput,
} from "../types/types.js";

export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await this.orderService.getAllOrders();
      res.status(200).json({ status: "Success", data: orders });
    } catch (error) {
      next(error);
    }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = String(req.params.orderId);
      const order = await this.orderService.getOrderById(orderId);
      res.status(200).json({ status: "Success", data: order });
    } catch (error) {
      next(error);
    }
  };

  getOrdersByUserId = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = String(req.params.userId);
      const orders = await this.orderService.getOrdersByUserId(userId);
      res.status(200).json({ status: "Success", data: orders });
    } catch (error) {
      next(error);
    }
  };

  createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input: CreateOrderInput = req.body;
      const order = await this.orderService.createOrder(input);
      res.status(201).json({ status: "Success", data: order });
    } catch (error) {
      next(error);
    }
  };

  updateOrderStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const orderId = String(req.params.orderId);
      const { status } = req.body;
      const input: UpdateOrderStatusInput = { orderId, status };
      const updatedOrder = await this.orderService.updateOrderStatus(input);
      res.status(200).json({ status: "Success", data: updatedOrder });
    } catch (error) {
      next(error);
    }
  };

  deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = String(req.params.orderId);
      const result = await this.orderService.deleteOrder(orderId);
      res.status(200).json({ status: "Success", data: result });
    } catch (error) {
      next(error);
    }
  };

  createPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const input: CreatePaymentInput = {
        orderId,
        ...req.body,
      };
      const payment = await this.orderService.createPayment(input);
      res.status(201).json({ status: "Success", data: payment });
    } catch (error) {
      next(error);
    }
  };

  getPaymentsByOrderId = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const orderId = String(req.params.orderId);
      const payments = await this.orderService.getPaymentsByOrderId(orderId);
      res.status(200).json({ status: "Success", data: payments });
    } catch (error) {
      next(error);
    }
  };

  // Pricing/Discount endpoints

  getPricingByProductId = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const productId = String(req.params.productId);
      const pricing = await this.orderService.getPricingByProductId(productId);
      res.status(200).json({ status: "Success", data: pricing });
    } catch (error) {
      next(error);
    }
  };

  getPricingByProductVariantId = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const variantId = String(req.params.variantId);
      const pricing =
        await this.orderService.getPricingByProductVariantId(variantId);
      res.status(200).json({ status: "Success", data: pricing });
    } catch (error) {
      next(error);
    }
  };

  getPricingByCategoryId = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const categoryId = String(req.params.categoryId);
      const pricing =
        await this.orderService.getPricingByCategoryId(categoryId);
      res.status(200).json({ status: "Success", data: pricing });
    } catch (error) {
      next(error);
    }
  };

  calculateOrderDiscount = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const orderId = String(req.params.orderId);
      const discount = await this.orderService.calculateOrderDiscount(orderId);
      res.status(200).json({ status: "Success", data: discount });
    } catch (error) {
      next(error);
    }
  };

  createVariantDiscount = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const input: CreateVariantDiscountInput = req.body;
      const discount = await this.orderService.createVariantDiscount(input);
      res.status(201).json({ status: "Success", data: discount });
    } catch (error) {
      next(error);
    }
  };

  createCategoryDiscount = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const input: CreateCategoryDiscountInput = req.body;
      const discount = await this.orderService.createCategoryDiscount(input);
      res.status(201).json({ status: "Success", data: discount });
    } catch (error) {
      next(error);
    }
  };
}
