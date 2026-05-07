-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "idDocumentUrl" TEXT,
ADD COLUMN     "licenseDocumentUrl" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- Tier 19 grandfathering: backfill all pre-existing customers to VERIFIED so
-- the new booking-creation gate doesn't disrupt existing test users / bookings.
-- Future inserts default to PENDING (above) and follow the new verification flow.
-- Decision logged in BACKLOG.md (Tier 19 cross-cutting decisions).
UPDATE "Customer" SET "status" = 'Verified';

-- AlterTable
ALTER TABLE "Owner" ADD COLUMN     "businessRegistrationDocumentUrl" TEXT;
