// Pure math + client-safe constants. Server-only helpers (DB reads/writes)
// live in lib/platform-settings-server.ts so this file stays importable
// from client components.

export const DEFAULT_COMMISSION_RATE = 0.15;
export const DEFAULT_SECURITY_DEPOSIT = 5000;
export const DEFAULT_MINIMUM_BOOKING_NOTICE_HOURS = 24;

export function calculateBookingAmount(
  dailyPrice: number,
  pickupDate: Date,
  returnDate: Date,
  commissionRate: number,
): {
  days: number;
  totalAmount: number;
  platformFee: number;
  ownerPayout: number;
} {
  // Inclusive calendar-day billing: every calendar date the renter holds
  // the car counts as a full rental day. Pickup May 4, Return May 6 = 3 days.
  const msPerDay = 24 * 60 * 60 * 1000;
  const gapDays = Math.ceil((returnDate.getTime() - pickupDate.getTime()) / msPerDay);
  const days = Math.max(1, gapDays + 1);
  const totalAmount = Math.round(dailyPrice * days);
  const platformFee = Math.round(totalAmount * commissionRate);
  const ownerPayout = totalAmount - platformFee;
  return { days, totalAmount, platformFee, ownerPayout };
}
