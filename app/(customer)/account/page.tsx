import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { CalendarDays, Car, ChevronRight } from "lucide-react";

import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { BookingStatus, PaymentStatus } from "@/types";
import { resolveListingPhotoUrl } from "@/lib/listing-assets";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const statusStyles: Record<string, string> = {
  [BookingStatus.PENDING]: "bg-amber-100 text-amber-700",
  [BookingStatus.CONFIRMED]: "bg-emerald-100 text-emerald-700",
  [BookingStatus.ONGOING]: "bg-blue-100 text-blue-700",
  [BookingStatus.COMPLETED]: "bg-gray-100 text-gray-700",
  [BookingStatus.CANCELLED]: "bg-red-100 text-red-700",
  [BookingStatus.REJECTED]: "bg-red-100 text-red-700",
};

export default async function CustomerAccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // proxy.ts already guarantees we got here as a logged-in customer.
  const customer = await db.customer.findUnique({ where: { email: user!.email! } });
  if (!customer) {
    // Defensive — proxy should have caught this.
    return null;
  }

  const bookings = await db.booking.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      referenceNumber: true,
      carName: true,
      carPhoto: true,
      pickupDate: true,
      returnDate: true,
      status: true,
      paymentStatus: true,
      totalAmount: true,
    },
  });

  const upcomingStatuses: string[] = [
    BookingStatus.PENDING,
    BookingStatus.CONFIRMED,
    BookingStatus.ONGOING,
  ];
  const pastStatuses: string[] = [
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
    BookingStatus.REJECTED,
  ];
  const upcoming = bookings.filter((b) => upcomingStatuses.includes(b.status));
  const past = bookings.filter((b) => pastStatuses.includes(b.status));

  return (
    <div className="min-h-screen bg-surface pb-16 font-sans">
      <header className="sticky top-0 z-30 bg-[rgb(250_248_255_/_0.85)] shadow-[0_8px_24px_rgb(19_27_46_/_0.04)] backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link className="font-headline text-2xl font-black tracking-tight text-primary" href="/">
            carBNB
          </Link>
          <div className="flex items-center gap-5">
            <Link className="text-sm font-semibold text-on-surface-variant hover:text-primary" href="/listings">
              Browse cars
            </Link>
            <UserMenu
              fullName={customer.fullName}
              links={[{ label: "My bookings", href: "/account" }]}
              roleLabel="Customer"
            />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 pt-10 sm:px-6">
        <div className="mb-8">
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
            My Bookings
          </h1>
          <p className="mt-2 text-base text-on-surface-variant">
            Track your upcoming trips and review past rentals.
          </p>
        </div>

        <BookingSection
          emptyMessage="No active bookings. Browse listings to reserve your next ride."
          items={upcoming}
          title="Upcoming & Active"
        />

        <div className="mt-10" />

        <BookingSection
          emptyMessage="No past bookings yet."
          items={past}
          title="Past Bookings"
        />
      </section>
    </div>
  );
}

function BookingSection({
  emptyMessage,
  items,
  title,
}: {
  emptyMessage: string;
  items: {
    id: string;
    referenceNumber: string;
    carName: string;
    carPhoto: string | null;
    pickupDate: Date;
    returnDate: Date;
    status: string;
    paymentStatus: string;
    totalAmount: number;
  }[];
  title: string;
}) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-bold text-on-surface">{title}</h2>
      {items.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-low p-8 text-center text-sm text-on-surface-variant">
          {emptyMessage}
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((booking) => {
            const photoUrl = booking.carPhoto ? resolveListingPhotoUrl(booking.carPhoto) : null;
            return (
              <li key={booking.id}>
                <Link
                  className="flex items-center gap-4 rounded-2xl bg-surface-container-lowest p-4 shadow-[0_6px_20px_rgb(19_27_46_/_0.05)] transition hover:shadow-[0_10px_28px_rgb(19_27_46_/_0.08)]"
                  href={`/account/bookings/${booking.id}`}
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-surface-container">
                    {photoUrl ? (
                      <Image
                        alt={booking.carName}
                        className="object-cover"
                        fill
                        sizes="64px"
                        src={photoUrl}
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-on-surface-variant">
                        <Car className="size-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-on-surface">
                        {booking.carName}
                      </h3>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          statusStyles[booking.status] ?? "bg-gray-100 text-gray-700",
                        )}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-2 text-xs text-on-surface-variant">
                      <CalendarDays className="size-3" />
                      {format(booking.pickupDate, "MMM d")} → {format(booking.returnDate, "MMM d, yyyy")}
                    </p>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                      {booking.referenceNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      {peso.format(booking.totalAmount)}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">
                      {booking.paymentStatus === PaymentStatus.PAID ? "Paid" : "Unpaid"}
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-on-surface-variant" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
