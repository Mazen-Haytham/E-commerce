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
    connection = null;
    channel = null;
    confirmChannel = null;
    connectRabbitMQ().catch((err) =>
      console.error("[RabbitMQ] reconnect attempt failed", err)
    );
  });

  channel = await connection.createChannel();
  await channel.prefetch(PREFETCH_COUNT);

  confirmChannel = await connection.createConfirmChannel();

  console.log(`[RabbitMQ] channels ready (prefetch=${PREFETCH_COUNT})`);
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
