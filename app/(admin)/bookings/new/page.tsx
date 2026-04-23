import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { BookingStatus, ListingStatus } from "@/types";
import { getUnavailableDates } from "@/lib/availability";
import { getPlatformSettings } from "@/lib/platform-settings-server";
import { NewAdminBookingForm } from "./new-admin-booking-form";

export const dynamic = "force-dynamic";

export default async function NewAdminBookingPage() {
  const [customers, listings, settings] = await Promise.all([
    db.customer.findMany({
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, email: true },
    }),
    db.carListing.findMany({
      where: { status: ListingStatus.ACTIVE },
      orderBy: { brand: "asc" },
      include: {
        availabilityRules: true,
        exceptions: true,
        bookings: {
          where: {
            status: {
              in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ONGOING],
            },
          },
          select: { pickupDate: true, returnDate: true, status: true },
        },
      },
    }),
    getPlatformSettings(),
  ]);

  // Precompute 90-day unavailable date strings per listing so the calendar
  // can grey them out instantly on vehicle switch without another round trip.
  const unavailableByListing: Record<string, string[]> = {};
  for (const l of listings) {
    const dates = getUnavailableDates({
      horizonDays: 90,
      rules: l.availabilityRules,
      exceptions: l.exceptions,
      existingBookings: l.bookings,
    });
    unavailableByListing[l.id] = dates.map((d) => d.toISOString());
  }

  const listingOptions = listings.map((l) => ({
    id: l.id,
    brand: l.brand,
    model: l.model,
    plateNumber: l.plateNumber,
    dailyPrice: l.dailyPrice,
  }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-2 mb-2">
        <Link
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground -ml-3",
          )}
          href="/bookings"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Bookings
        </Link>
      </div>

      <PageHeader
        title="Create Booking (Admin)"
        description="Create a booking on behalf of a customer. Skips PENDING and lands as CONFIRMED immediately; availability is still enforced."
      />

      <NewAdminBookingForm
        commissionRate={settings.commissionRate}
        customers={customers}
        listings={listingOptions}
        unavailableByListing={unavailableByListing}
      />
    </div>
  );
}
