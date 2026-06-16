// Note: kept the original filename (and its existing typo) so I didn't break
// any of your current imports. Feel free to rename to `exchange.ts` later —
// just update the two import paths in messaging/ when you do.

export const EXCHANGES = {
  // The one exchange the whole app publishes events to.
  APP: "app.events",
  // Where messages go when a consumer fails to process them (see topology.ts).
  APP_DLX: "app.events.dlx",
} as const;

// Routing keys describe WHAT happened. Convention: <module>.<entity>.<action>
// A topic exchange matches these against binding patterns (supports # and *).
export const ROUTING_KEYS = {
  ORDER_CREATED: "order.created",
  ORDER_CANCELLED: "order.cancelled",
  INVENTORY_STOCK_RESERVED: "inventory.stock.reserved",
  INVENTORY_STOCK_FAILED: "inventory.stock.failed",
  USER_REGISTERED: "user.registered",
} as const;

// Queues describe WHO is listening. Convention: <module>.<purpose>.queue
export const QUEUES = {
  INVENTORY_ORDER_EVENTS: "inventory.order-events.queue",
  ORDERS_INVENTORY_EVENTS: "orders.inventory-events.queue",
  DEAD_LETTER: "app.events.dlq",
} as const;

export type RoutingKey = (typeof ROUTING_KEYS)[keyof typeof ROUTING_KEYS];
export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
