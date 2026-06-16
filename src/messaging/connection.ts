import amqp from "amqplib";

let connection;
let channel:any;

export async function connectRabbitMQ() {
  connection = await amqp.connect("amqp://localhost");

  channel = await connection.createChannel();

  console.log("RabbitMQ connected");
}

export function getChannel() {
  if (!channel) {
    throw new Error("RabbitMQ not connected");
  }

  return channel;
}