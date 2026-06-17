-- CreateTable
CREATE TABLE "outbox_events" (
    "id" BIGSERIAL NOT NULL,
    "event_id" UUID NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "aggregate_type" VARCHAR(50) NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" VARCHAR(20) DEFAULT 'PENDING',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(6),

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_events" (
    "event_id" UUID NOT NULL,
    "consumer_name" VARCHAR(100) NOT NULL,
    "processed_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_event_id_key" ON "outbox_events"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "processed_events_event_id_consumer_name_key" ON "processed_events"("event_id", "consumer_name");
