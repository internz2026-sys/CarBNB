-- AlterTable
ALTER TABLE "Owner" ADD COLUMN     "businessRegNumber" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'INDIVIDUAL';

-- CreateTable
CREATE TABLE "FleetCarLink" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "managementFeePercent" DOUBLE PRECISION,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "severedAt" TIMESTAMP(3),

    CONSTRAINT "FleetCarLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FleetCarLink_fleetId_status_idx" ON "FleetCarLink"("fleetId", "status");

-- CreateIndex
CREATE INDEX "FleetCarLink_listingId_status_idx" ON "FleetCarLink"("listingId", "status");

-- AddForeignKey
ALTER TABLE "FleetCarLink" ADD CONSTRAINT "FleetCarLink_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "CarListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetCarLink" ADD CONSTRAINT "FleetCarLink_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
