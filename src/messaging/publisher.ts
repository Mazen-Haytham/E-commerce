import { randomUUID } from "crypto";
import { getConfirmChannel } from "./connection.js";
import { EXCHANGES } from "../shared/exchnage.js";
import { EventEnvelope } from "./events.js";

// Wraps a payload in an envelope, then publishes it and waits for the
// broker's confirmation. If the broker is unreachable or rejects it, this
// rejects too — so a publish failure is something your service code can
// actually catch, instead of silently disappearing.
export async function publishEvent<T>(routingKey: string, payload: T): Promise<void> {
  const channel = getConfirmChannel();

  const envelope: EventEnvelope<T> = {
    eventId: randomUUID(),
    eventName: routingKey,
    occurredAt: new Date().toISOString(),
    payload,
  };

  const buffer = Buffer.from(JSON.stringify(envelope));

  await new Promise<void>((resolve, reject) => {
    channel.publish(
      EXCHANGES.APP,
      routingKey,
      buffer,
      {
        persistent: true, // survive a broker restart
        contentType: "application/json",
        messageId: envelope.eventId,
      },
      (err) => {
        if (err) {
          console.error(`[RabbitMQ] publish failed for "${routingKey}"`, err);
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}
