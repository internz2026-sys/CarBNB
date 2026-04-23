import { eachDayOfInterval, format } from "date-fns";
import { BookingStatus, DayOfWeek } from "@/types";

type Rule = {
  dayOfWeek: string;
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
};

type Exception = {
  date: Date;
  isAvailable: boolean;
  reason: string | null;
};

type ExistingBooking = {
  pickupDate: Date;
  returnDate: Date;
  status: string;
};

// Booking statuses that block a new booking on the same dates. A CANCELLED
// or REJECTED booking frees up the slot. Values match BookingStatus enum
// (stored title-cased in the DB — e.g. "Pending", not "PENDING").
const BLOCKING_STATUSES = new Set<string>([
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.ONGOING,
]);

// Given a listing's rules + exceptions + existing bookings, decide whether
// a fresh booking over [pickup, return] is allowed. Returns either ok=true
// or ok=false with a human-readable reason.
export function checkAvailability({
  pickup,
  returnDate,
  rules,
  exceptions,
  existingBookings,
}: {
  pickup: Date;
  returnDate: Date;
  rules: Rule[];
  exceptions: Exception[];
  existingBookings: ExistingBooking[];
}): { ok: true } | { ok: false; reason: string } {
  if (returnDate < pickup) {
    return { ok: false, reason: "Return date must be on or after pickup date." };
  }

  // Existing booking overlap check — any blocking booking whose date range
  // intersects ours kills the new booking.
  for (const booking of existingBookings) {
    if (!BLOCKING_STATUSES.has(booking.status)) continue;
    const overlaps =
      pickup <= booking.returnDate && returnDate >= booking.pickupDate;
    if (overlaps) {
      return {
        ok: false,
        reason: `Car is already booked from ${format(booking.pickupDate, "MMM d")} to ${format(booking.returnDate, "MMM d, yyyy")}.`,
      };
    }
  }

  // Day-by-day rule + exception check. Each day in [pickup, returnDate]
  // must resolve to available=true.
  const rulesByDay = new Map<string, Rule>(rules.map((r) => [r.dayOfWeek, r]));
  const exceptionsByDate = new Map<string, Exception>();
  for (const ex of exceptions) {
    exceptionsByDate.set(format(ex.date, "yyyy-MM-dd"), ex);
  }

  const days = eachDayOfInterval({ start: pickup, end: returnDate });
  for (const day of days) {
    const dateKey = format(day, "yyyy-MM-dd");
    const exception = exceptionsByDate.get(dateKey);

    // Exception wins — forced available OR explicitly blocked.
    if (exception) {
      if (!exception.isAvailable) {
        return {
          ok: false,
          reason: `${format(day, "MMM d")} is blocked${exception.reason ? ` (${exception.reason})` : ""}.`,
        };
      }
      continue;
    }

    // Fall back to the weekly rule for this day of week. If there's no rule,
    // or the rule says unavailable, reject.
    const dayOfWeekName = format(day, "EEEE") as DayOfWeek;
    const rule = rulesByDay.get(dayOfWeekName);
    if (!rule || !rule.isAvailable) {
      return {
        ok: false,
        reason: `${format(day, "MMM d")} (${dayOfWeekName}) is not in the listing's weekly schedule.`,
      };
    }
  }

  return { ok: true };
}

// Utility for the listing detail date picker: return the set of dates that
// should be visually disabled in the next N days.
export function getUnavailableDates({
  horizonDays,
  rules,
  exceptions,
  existingBookings,
  from = new Date(),
}: {
  horizonDays: number;
  rules: Rule[];
  exceptions: Exception[];
  existingBookings: ExistingBooking[];
  from?: Date;
}): Date[] {
  const rulesByDay = new Map<string, Rule>(rules.map((r) => [r.dayOfWeek, r]));
  const exceptionsByDate = new Map<string, Exception>();
  for (const ex of exceptions) {
    exceptionsByDate.set(format(ex.date, "yyyy-MM-dd"), ex);
  }

  // Pre-compute the set of date strings (yyyy-MM-dd) that fall inside any
  // blocking booking. Comparing by string sidesteps UTC-vs-local skew —
  // pickupDate/returnDate are UTC midnights, but `eachDayOfInterval` emits
  // local midnights, and the offset shifts the interval check by one day.
  const bookedDateKeys = new Set<string>();
  for (const booking of existingBookings) {
    if (!BLOCKING_STATUSES.has(booking.status)) continue;
    const span = eachDayOfInterval({
      start: booking.pickupDate,
      end: booking.returnDate,
    });
    for (const d of span) {
      bookedDateKeys.add(format(d, "yyyy-MM-dd"));
    }
  }

  const horizon = new Date(from.getTime() + horizonDays * 24 * 60 * 60 * 1000);
  const days = eachDayOfInterval({ start: from, end: horizon });
  const unavailable: Date[] = [];

  for (const day of days) {
    const dateKey = format(day, "yyyy-MM-dd");
    const exception = exceptionsByDate.get(dateKey);

    let dayAvailable: boolean;
    if (exception) {
      dayAvailable = exception.isAvailable;
    } else {
      const rule = rulesByDay.get(format(day, "EEEE"));
      dayAvailable = Boolean(rule?.isAvailable);
    }

    if (!dayAvailable) {
      unavailable.push(day);
      continue;
    }

    if (bookedDateKeys.has(dateKey)) {
      unavailable.push(day);
    }
  }

  return unavailable;
}
