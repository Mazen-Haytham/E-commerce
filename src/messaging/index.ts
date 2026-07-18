import { connectRabbitMQ, registerConsumerCallback } from "./connection.js";
import { setupTopology } from "./topology.js";

// Call this once at startup, before any module tries to publish or consume.
export async function initMessaging(): Promise<void> {
  await connectRabbitMQ();
  await setupTopology();
  // Re-declare topology on every reconnect (must run before consumers re-attach).
  registerConsumerCallback(setupTopology);
}

export { publishEvent, publishEnvelope } from "./publisher.js";
export { startConsumer } from "./consumer.js";
export { closeRabbitMQ } from "./connection.js";
