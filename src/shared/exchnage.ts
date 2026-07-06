// Basic exchanges for the messaging system
export const EXCHANGES = {
  APP: "app.events",
  APP_DLX: "app.dlx", // Dead-letter exchange for failed messages
};

// Routing keys - add your event routing keys here as you define them
export const ROUTING_KEYS = {
  ORDER_CREATED: "order.created",
  ORDER_CANCELLED: "order.cancelled",
  INVENTORY_STOCK_RESERVED: "inventory.stock.reserved",
  INVENTORY_STOCK_REJECTED: "inventory.stock.rejected",
  INVENTORY_STOCK_FAILED: "inventory.stock.failed",
};

// Basic queues for core services
export const QUEUES = {
  DEAD_LETTER: "app.dead_letter",
  INVENTORY_ORDER_EVENTS: "inventory.order_events",
  ORDERS_INVENTORY_EVENTS: "orders.inventory_events",
};
