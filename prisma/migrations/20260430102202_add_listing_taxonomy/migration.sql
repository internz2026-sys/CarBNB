-- AlterTable
ALTER TABLE "CarListing" ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "vehicleType" TEXT NOT NULL DEFAULT 'SEDAN';
