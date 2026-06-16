import { getChannel } from "./connection.js";
import { EXCHANGES } from "../shared/exchnage.js";

export async function setupExchange() {
  const channel = getChannel();

  await channel.assertExchange(
    EXCHANGES.APP,
    "topic",
    {
      durable: true
    }
  );
}