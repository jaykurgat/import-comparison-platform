-- Add first-class shipment tracking for AliExpress-backed import orders.

CREATE TYPE "ImportShipmentStatus" AS ENUM (
  'PENDING',
  'LABEL_CREATED',
  'IN_TRANSIT',
  'ARRIVED_DESTINATION',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'EXCEPTION',
  'CANCELLED',
  'UNKNOWN'
);

CREATE TABLE "ImportShipment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "supplierOrderId" TEXT NOT NULL,
  "carrier" TEXT,
  "trackingNumber" TEXT,
  "shippingMethod" TEXT,
  "currentStatus" "ImportShipmentStatus" NOT NULL DEFAULT 'PENDING',
  "currentRawStatus" TEXT,
  "estimatedDeliveryStart" TIMESTAMP(3),
  "estimatedDeliveryEnd" TIMESTAMP(3),
  "shippedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ImportShipment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImportShipmentEvent" (
  "id" TEXT NOT NULL,
  "shipmentId" TEXT NOT NULL,
  "status" "ImportShipmentStatus" NOT NULL,
  "rawStatus" TEXT,
  "description" TEXT,
  "location" TEXT,
  "eventDate" TIMESTAMP(3) NOT NULL,
  "externalKey" TEXT NOT NULL,
  "raw" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImportShipmentEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ImportShipmentEvent_externalKey_key" ON "ImportShipmentEvent"("externalKey");
CREATE INDEX "ImportShipment_orderId_idx" ON "ImportShipment"("orderId");
CREATE INDEX "ImportShipment_supplierOrderId_idx" ON "ImportShipment"("supplierOrderId");
CREATE INDEX "ImportShipment_trackingNumber_idx" ON "ImportShipment"("trackingNumber");
CREATE INDEX "ImportShipment_currentStatus_lastSyncedAt_idx" ON "ImportShipment"("currentStatus", "lastSyncedAt");
CREATE INDEX "ImportShipmentEvent_shipmentId_eventDate_idx" ON "ImportShipmentEvent"("shipmentId", "eventDate");

ALTER TABLE "ImportShipment"
  ADD CONSTRAINT "ImportShipment_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "ImportOrder"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ImportShipmentEvent"
  ADD CONSTRAINT "ImportShipmentEvent_shipmentId_fkey"
  FOREIGN KEY ("shipmentId") REFERENCES "ImportShipment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
