import { connectRabbitMQ } from "./connection.js";
import { setupTopology } from "./topology.js";

// Call this once at startup, before any module tries to publish or consume.
export async function initMessaging(): Promise<void> {
  await connectRabbitMQ();
  await setupTopology();
}

export { publishEvent } from "./publisher.js";
export { startConsumer } from "./consumer.js";
export { closeRabbitMQ } from "./connection.js";
