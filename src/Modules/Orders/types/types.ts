// Base Order Types
export interface Order {
  id: string;
  userId: string;
  totalPrice: any; // Decimal from Prisma
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// OrderItem Types
export interface OrderItem {
  id: string;
  orderId: string;
  productVariantId: string;
  quantity: number;
  unitPrice: any; // Decimal from Prisma
}

// OrderItem Input
export interface CreateOrderItemInput {
  productVariantId: string;
  quantity: number;
  unitPrice: number;
}

// Payment Types
export interface Payment {
  id: string;
  orderId: string;
  paymentMethodId: string;
  amount: any; // Decimal from Prisma
  transactionId: string | null;
  status: string;
  createdAt: Date;
}

// Payment Method Types
export interface PaymentMethod {
  id: string;
  name: string;
}

// Create Order Input
export interface CreateOrderInput {
  userId: string;
  items: CreateOrderItemInput[];
  totalPrice: number;
}

// Create Order Response
export interface CreateOrderResponse {
  id: string;
  userId: string;
  totalPrice: any;
  status: string;
  items: OrderItem[];
  createdAt: Date;
}

// Get Order Response (with items and payments)
export interface GetOrderResponse {
  id: string;
  userId: string;
  totalPrice: any;
  status: string;
  items: OrderItem[];
  payments: Payment[];
  createdAt: Date;
  updatedAt: Date;
}

// Get All Orders Response
export interface GetAllOrdersResponse {
  id: string;
  userId: string;
  totalPrice: any;
  status: string;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Update Order Status Input
export interface UpdateOrderStatusInput {
  orderId: string;
  status: string;
}

// Update Order Status Response
export interface UpdateOrderStatusResponse {
  id: string;
  status: string;
  updatedAt: Date;
}

// Delete Order Response (soft delete)
export interface DeleteOrderResponse {
  id: string;
  message: string;
  deletedAt: Date;
}

// Get Orders by User Response
export interface GetOrdersByUserResponse {
  id: string;
  totalPrice: any;
  status: string;
  itemCount: number;
  createdAt: Date;
}

// Payment Input
export interface CreatePaymentInput {
  orderId: string;
  paymentMethodId: string;
  amount: number;
  transactionId?: string;
}

// Payment Response
export interface CreatePaymentResponse {
  id: string;
  orderId: string;
  paymentMethodId: string;
  amount: any;
  transactionId: string | null;
  status: string;
  createdAt: Date;
}
// Discount Input
export interface CreateVariantDiscountInput {
  productVariantId: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number; // percentage (0-100) or amount
}

export interface CreateCategoryDiscountInput {
  categoryId: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number; // percentage (0-100) or amount
}

// Discount Response
export interface CreateDiscountResponse {
  id: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  createdAt: Date;
}
