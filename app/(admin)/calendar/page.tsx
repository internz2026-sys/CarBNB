import { db } from "@/lib/db";
import { BookingStatus, ListingStatus } from "@/types";
import { CalendarView } from "./calendar-view";

export const dynamic = "force-dynamic";

export default async function GlobalCalendarPage() {
  const [carListings, bookings, exceptions] = await Promise.all([
    db.carListing.findMany({
      where: {
        status: { in: [ListingStatus.ACTIVE, ListingStatus.BOOKED, ListingStatus.PENDING_APPROVAL] },
      },
      orderBy: [{ brand: "asc" }, { model: "asc" }],
      select: {
        id: true,
        plateNumber: true,
        brand: true,
        model: true,
      },
    }),
    db.booking.findMany({
      where: {
        status: {
          in: [
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.ONGOING,
            BookingStatus.COMPLETED,
          ],
        },
      },
      orderBy: { pickupDate: "asc" },
      select: {
        id: true,
        referenceNumber: true,
        carListingId: true,
        customerName: true,
        pickupDate: true,
        returnDate: true,
        totalAmount: true,
      },
    }),
    db.carAvailabilityException.findMany({
      orderBy: { date: "asc" },
      select: {
        id: true,
        carListingId: true,
        date: true,
        isAvailable: true,
        reason: true,
      },
    }),
  ]);

  return (
    <CalendarView
      carListings={carListings}
      bookings={bookings.map((b) => ({
        id: b.id,
        referenceNumber: b.referenceNumber,
        carListingId: b.carListingId,
        customerName: b.customerName,
        pickupDate: b.pickupDate.toISOString(),
        returnDate: b.returnDate.toISOString(),
        totalAmount: b.totalAmount,
      }))}
      exceptions={exceptions.map((e) => ({
        id: e.id,
        carListingId: e.carListingId,
        date: e.date.toISOString(),
        isAvailable: e.isAvailable,
        reason: e.reason,
      }))}
    />
  );
}
