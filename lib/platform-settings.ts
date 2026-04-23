// TODO(tier-7): replace these constants with a `PlatformSettings` DB row
// managed via /settings. For now, every booking calculation in the app
// funnels through these helpers so there's only one place to change.
// Decision pending (see BACKLOG "Commission rate" row): 15% (matches admin
// UI) vs 20% (matches subset of mock data). Defaulting to 15% to match
// what admins see in the /accounting UI.

export const COMMISSION_RATE = 0.15;

export function calculateBookingAmount(dailyPrice: number, pickupDate: Date, returnDate: Date): {
  days: number;
  totalAmount: number;
  platformFee: number;
  ownerPayout: number;
} {
  // Inclusive calendar-day billing: every calendar date the renter holds
  // the car counts as a full rental day. Matches what the range calendar
  // visually highlights and the local P2P market norm.
  //   Pickup May 4, Return May 4 → 1 day
  //   Pickup May 4, Return May 5 → 2 days
  //   Pickup May 4, Return May 6 → 3 days
  const msPerDay = 24 * 60 * 60 * 1000;
  const gapDays = Math.ceil((returnDate.getTime() - pickupDate.getTime()) / msPerDay);
  const days = Math.max(1, gapDays + 1);
  const totalAmount = Math.round(dailyPrice * days);
  const platformFee = Math.round(totalAmount * COMMISSION_RATE);
  const ownerPayout = totalAmount - platformFee;
  return { days, totalAmount, platformFee, ownerPayout };
}
