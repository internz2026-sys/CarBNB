-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "cancellationNote" TEXT,
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentNotes" TEXT,
ADD COLUMN     "paymentProofUrl" TEXT,
ADD COLUMN     "paymentReceivedAt" TIMESTAMP(3),
ADD COLUMN     "paymentReceivedBy" TEXT,
ADD COLUMN     "rentalCompletedAt" TIMESTAMP(3),
ADD COLUMN     "rentalStartedAt" TIMESTAMP(3);
