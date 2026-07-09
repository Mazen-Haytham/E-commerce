export const ORDER_CANCELLED_EVENT_TYPE = "OrderCancelled" as const;

export interface OrderCancelledPayload {
  orderId: string;
  previousStatus: string;
  items: Array<{ productVariantId: string; quantity: number }>;
}

export interface OrderCancelledEventEnvelope {
  eventId: string;
  eventType: typeof ORDER_CANCELLED_EVENT_TYPE;
  occurredAt: string;
  payload: OrderCancelledPayload;
}

export interface PendingOrderCancelledEvent {
  eventId: string;
  occurredAt: string;
  payload: OrderCancelledPayload;
}
