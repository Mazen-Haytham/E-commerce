import { getChannel } from "./connection.js";
import { EXCHANGES, ROUTING_KEYS, QUEUES } from "../shared/exchnage.js";

// "Topology" just means: which exchanges exist, which queues exist, and how
// they're wired together. Declaring it all in one place means any module
// can read this file and understand the entire messaging layout at a glance.
export async function setupTopology(): Promise<void> {
  const channel = getChannel();

  // 1. The main exchange. "topic" type lets queues subscribe with wildcard
  //    patterns (e.g. "order.*") instead of needing an exact match.
  await channel.assertExchange(EXCHANGES.APP, "topic", { durable: true });

  // 2. The dead-letter exchange + a single catch-all queue behind it.
  //    If a consumer nacks a message (see consumer.ts), RabbitMQ reroutes it
  //    here instead of deleting it or looping forever — so nothing silently
  //    vanishes, and you have one place to go look when something breaks.
  await channel.assertExchange(EXCHANGES.APP_DLX, "topic", { durable: true });
  await channel.assertQueue(QUEUES.DEAD_LETTER, { durable: true });
  await channel.bindQueue(QUEUES.DEAD_LETTER, EXCHANGES.APP_DLX, "#");

  // 3. One durable queue per consumer. Every queue gets `x-dead-letter-exchange`
  //    so a failed message automatically routes to the DLQ above.

  await channel.assertQueue(QUEUES.INVENTORY_ORDER_EVENTS, {
    durable: true,
    arguments: { "x-dead-letter-exchange": EXCHANGES.APP_DLX },
  });
  await channel.bindQueue(QUEUES.INVENTORY_ORDER_EVENTS, EXCHANGES.APP, ROUTING_KEYS.ORDER_CREATED);
  await channel.bindQueue(QUEUES.INVENTORY_ORDER_EVENTS, EXCHANGES.APP, ROUTING_KEYS.ORDER_CANCELLED);

  await channel.assertQueue(QUEUES.ORDERS_INVENTORY_EVENTS, {
    durable: true,
    arguments: { "x-dead-letter-exchange": EXCHANGES.APP_DLX },
  });
  await channel.bindQueue(
    QUEUES.ORDERS_INVENTORY_EVENTS,
    EXCHANGES.APP,
    ROUTING_KEYS.INVENTORY_STOCK_RESERVED
  );
  await channel.bindQueue(
    QUEUES.ORDERS_INVENTORY_EVENTS,
    EXCHANGES.APP,
    ROUTING_KEYS.INVENTORY_STOCK_REJECTED
  );

  console.log("[RabbitMQ] topology ready (exchanges, queues, bindings)");
}
