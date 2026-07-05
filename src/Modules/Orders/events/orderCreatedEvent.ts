export const ORDER_CREATED_EVENT_TYPE = "OrderCreated" as const;

export interface OrderCreatedLineItem {
  productVariantId: string;
  quantity: number;
}

export interface OrderCreatedPayload {
  orderId: string;
  userId: string;
  items: OrderCreatedLineItem[];
}

export interface OrderCreatedEventEnvelope {
  eventId: string;
  eventType: typeof ORDER_CREATED_EVENT_TYPE;
  occurredAt: string;
  payload: OrderCreatedPayload;
}

export interface PendingOrderCreatedEvent {
  eventId: string;
  occurredAt: string;
  payload: OrderCreatedPayload;
}
