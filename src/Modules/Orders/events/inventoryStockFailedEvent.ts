export const INVENTORY_STOCK_FAILED_EVENT_TYPE =
  "InventoryStockFailed" as const;

export interface InventoryStockFailedPayload {
  orderId: string;
  reason: string;
}

export interface InventoryStockFailedEventEnvelope {
  eventId: string;
  eventType: typeof INVENTORY_STOCK_FAILED_EVENT_TYPE;
  occurredAt: string;
  payload: InventoryStockFailedPayload;
}
