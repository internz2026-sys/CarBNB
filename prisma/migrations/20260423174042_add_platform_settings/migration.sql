-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "securityDeposit" DOUBLE PRECISION NOT NULL DEFAULT 5000,
    "autoApproveVerifiedCustomers" BOOLEAN NOT NULL DEFAULT false,
    "requireOwnerConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "minimumBookingNoticeHours" INTEGER NOT NULL DEFAULT 24,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);
