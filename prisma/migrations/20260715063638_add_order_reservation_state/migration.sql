-- CreateEnum
CREATE TYPE "inventory"."OrderReservationState" AS ENUM ('PENDING_CREATE', 'RESERVED', 'PRE_CANCELLED', 'CANCELLED_AFTER_RESERVE', 'REJECTED');

-- CreateTable
CREATE TABLE "inventory"."order_reservation_state" (
    "order_id" UUID NOT NULL,
    "state" "inventory"."OrderReservationState" NOT NULL,
    "items" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_reservation_state_pkey" PRIMARY KEY ("order_id")
);
