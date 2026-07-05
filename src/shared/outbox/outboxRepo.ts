import { PrismaClient } from "@prisma/client/extension";
import { prisma } from "../prisma.js";

export interface InsertOutboxEventInput {
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  payload: unknown;
}

export class OutboxRepo {
  insertEvent = async (
    db: PrismaClient,
    input: InsertOutboxEventInput,
  ): Promise<void> => {
    await db.outboxEvent.create({
      data: {
        eventId: input.eventId,
        aggregateId: input.aggregateId,
        aggregateType: input.aggregateType,
        eventType: input.eventType,
        payload: input.payload as object,
        status: "PENDING",
      },
    });
  };

  markPublished = async (eventId: string): Promise<void> => {
    await prisma.outboxEvent.update({
      where: { eventId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  };
}
