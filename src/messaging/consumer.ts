import { getChannel, registerConsumerCallback } from "./connection.js";
import { EventEnvelope } from "./events.js";

interface ConsumeOptions {
  queue: string;
  onMessage: (envelope: EventEnvelope, routingKey: string) => Promise<void>;
}

// ack = "I'm done, you can delete this message."
// nack(msg, false, false) = "this failed, and don't put it back in line —
// send it to the dead-letter queue instead." The `false, false` matters:
// requeuing a message that keeps failing (e.g. bad data) just makes it loop
// forever and burn CPU, so we let the DLQ catch it for manual inspection.
export async function startConsumer({ queue, onMessage }: ConsumeOptions): Promise<void> {
  // The actual registration logic, captured in a closure so it can be
  // re-run on a fresh channel after a reconnect (see registerConsumerCallback).
  async function register(): Promise<void> {
    const channel = getChannel();

    await channel.consume(queue, async (msg) => {
      if (!msg) return; // broker cancelled this consumer (e.g. queue deleted)

      try {
        const envelope: EventEnvelope = JSON.parse(msg.content.toString());
        await onMessage(envelope, msg.fields.routingKey);
        channel.ack(msg);
      } catch (err) {
        console.error(`[RabbitMQ] failed to process message from "${queue}"`, err);
        channel.nack(msg, false, false);
      }
    });

    console.log(`[RabbitMQ] consuming from "${queue}"`);
  }

  // Run immediately for the initial startup, then remember it for reconnects.
  await register();
  registerConsumerCallback(register);
}
