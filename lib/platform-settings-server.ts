import "server-only";
import { db } from "@/lib/db";

const SINGLETON_ID = "singleton";

// Fetches the single PlatformSettings row. Self-heals: if the row is
// missing (fresh DB, accidental wipe), creates it with Prisma-schema
// defaults before returning. Safe to call from any server context.
export async function getPlatformSettings() {
  let row = await db.platformSettings.findUnique({ where: { id: SINGLETON_ID } });
  if (!row) {
    row = await db.platformSettings.create({ data: { id: SINGLETON_ID } });
  }
  return row;
}

export type PlatformSettingsUpdate = {
  commissionRate?: number;
  securityDeposit?: number;
  autoApproveVerifiedCustomers?: boolean;
  requireOwnerConfirmation?: boolean;
  minimumBookingNoticeHours?: number;
  updatedBy?: string;
};

export async function upsertPlatformSettings(data: PlatformSettingsUpdate) {
  return db.platformSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...data },
    update: data,
  });
}
