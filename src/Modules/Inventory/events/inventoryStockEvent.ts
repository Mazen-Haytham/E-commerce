export const STOCK_RESERVED_EVENT_TYPE = "StockReserved" as const;
export const STOCK_REJECTED_EVENT_TYPE = "StockRejected" as const;

export interface StockReservedPayload {
  orderId: string;
  originalEventId: string;
}

export interface StockRejectedPayload {
  orderId: string;
  reason: string;
}

export type InventoryStockEventPayload =
  | StockReservedPayload
  | StockRejectedPayload;

export interface PendingInventoryStockEvent {
  eventId: string;
  eventType: typeof STOCK_RESERVED_EVENT_TYPE | typeof STOCK_REJECTED_EVENT_TYPE;
  occurredAt: string;
  routingKey: string;
  payload: InventoryStockEventPayload;
}
