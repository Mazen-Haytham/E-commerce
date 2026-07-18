import amqp, { ChannelModel, Channel, ConfirmChannel } from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const RECONNECT_DELAY_MS = Number(process.env.RABBITMQ_RECONNECT_DELAY_MS || 5000);
const PREFETCH_COUNT = Number(process.env.RABBITMQ_PREFETCH || 10);

let connection: ChannelModel | null = null;

// Two channels, two jobs:
// - `channel` is for CONSUMING. It has a prefetch limit so one greedy consumer
//   can't hoard every message, and we control ack/nack manually on it.
// - `confirmChannel` is for PUBLISHING. A "confirm channel" makes the broker
//   tell us "got it, written to disk" before we consider a publish successful.
let channel: Channel | null = null;
let confirmChannel: ConfirmChannel | null = null;

let isShuttingDown = false;

// Holds every consumer callback so they can be re-registered on the new
// channel after a reconnect. Each entry is exactly the args that were
// originally passed to channel.consume().
type ConsumerCallback = () => Promise<void>;
const consumerRegistry: ConsumerCallback[] = [];

export function registerConsumerCallback(fn: ConsumerCallback): void {
  consumerRegistry.push(fn);
}

async function reRegisterConsumers(): Promise<void> {
  for (const fn of consumerRegistry) {
    try {
      await fn();
    } catch (err) {
      console.error("[RabbitMQ] failed to re-register consumer after reconnect", err);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Keeps retrying forever, with a fixed delay, until a connection succeeds.
// This is the same idea as redialing a phone number that's busy.
async function connectWithRetry(): Promise<ChannelModel> {
  while (true) {
    try {
      return await amqp.connect(RABBITMQ_URL);
    } catch (err) {
      console.error(
        `[RabbitMQ] could not connect, retrying in ${RECONNECT_DELAY_MS}ms`,
        (err as Error).message
      );
      await sleep(RECONNECT_DELAY_MS);
    }
  }
}

export async function connectRabbitMQ(): Promise<void> {
  connection = await connectWithRetry();
  console.log("[RabbitMQ] connected");

  connection.on("error", (err: Error) => {
    // "error" fires for protocol-level problems. "close" always fires right
    // after, so the actual reconnect logic lives there to avoid double work.
    console.error("[RabbitMQ] connection error:", err.message);
  });

  connection.on("close", () => {
    if (isShuttingDown) return; // this is an intentional shutdown, not a drop
    console.warn("[RabbitMQ] connection lost — reconnecting...");
    // NOTE: do NOT null the channels here. Keep the stale references so that
    // any in-flight publish attempts fail with an amqplib error (which the
    // outbox catch will handle) instead of our own "channel not ready" throw.
    // The references are replaced atomically once the new channels are open.
    connectRabbitMQ().catch((err) =>
      console.error("[RabbitMQ] reconnect attempt failed", err)
    );
  });

  // Replace channels atomically — both are ready before we expose them.
  const newChannel = await connection.createChannel();
  await newChannel.prefetch(PREFETCH_COUNT);
  const newConfirmChannel = await connection.createConfirmChannel();

  channel = newChannel;
  confirmChannel = newConfirmChannel;

  console.log(`[RabbitMQ] channels ready (prefetch=${PREFETCH_COUNT})`);

  // Re-register every consumer on the new channel.
  // On the very first call consumerRegistry is empty so this is a no-op.
  await reRegisterConsumers();
}

export function getChannel(): Channel {
  if (!channel) {
    throw new Error("RabbitMQ channel not ready — did you await connectRabbitMQ()?");
  }
  return channel;
}

export function getConfirmChannel(): ConfirmChannel {
  if (!confirmChannel) {
    throw new Error("RabbitMQ confirm channel not ready — did you await connectRabbitMQ()?");
  }
  return confirmChannel;
}

export async function closeRabbitMQ(): Promise<void> {
  isShuttingDown = true;
  try {
    await channel?.close();
    await confirmChannel?.close();
    await connection?.close();
    console.log("[RabbitMQ] closed gracefully");
  } catch (err) {
    console.error("[RabbitMQ] error while closing", err);
  }
}
