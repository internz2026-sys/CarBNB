import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Car,
  ChevronRight,
  ClipboardList,
  TrendingUp,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { BookingStatus, ListingStatus, OwnerStatus } from "@/types";
import { getPlatformSettings } from "@/lib/platform-settings-server";
import { resolveListingPhotoUrl } from "@/lib/listing-assets";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const bookingStatusStyles: Record<string, string> = {
  [BookingStatus.ONGOING]: "bg-blue-100 text-blue-700",
  [BookingStatus.CONFIRMED]: "bg-indigo-100 text-indigo-700",
  [BookingStatus.PENDING]: "bg-amber-100 text-amber-700",
};

export default async function DashboardPage() {
  const [
    totalOwners,
    verifiedOwners,
    activeListings,
    pendingOwners,
    pendingListings,
    revenueAgg,
    activeBookings,
    pendingOwnerQueue,
    pendingListingQueue,
    settings,
  ] = await Promise.all([
    db.owner.count(),
    db.owner.count({ where: { status: OwnerStatus.VERIFIED } }),
    db.carListing.count({ where: { status: ListingStatus.ACTIVE } }),
    db.owner.count({ where: { status: OwnerStatus.PENDING } }),
    db.carListing.count({ where: { status: ListingStatus.PENDING_APPROVAL } }),
    db.booking.aggregate({
      where: { status: BookingStatus.COMPLETED },
      _sum: { totalAmount: true, platformFee: true, ownerPayout: true },
    }),
    db.booking.findMany({
      where: {
        status: { in: [BookingStatus.ONGOING, BookingStatus.CONFIRMED] },
      },
      orderBy: { pickupDate: "asc" },
      take: 5,
      select: {
        id: true,
        referenceNumber: true,
        carName: true,
        carPhoto: true,
        plateNumber: true,
        customerName: true,
        ownerName: true,
        status: true,
        pickupDate: true,
        returnDate: true,
        totalAmount: true,
      },
    }),
    db.owner.findMany({
      where: { status: OwnerStatus.PENDING },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, fullName: true, email: true, createdAt: true },
    }),
    db.carListing.findMany({
      where: { status: ListingStatus.PENDING_APPROVAL },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        brand: true,
        model: true,
        plateNumber: true,
        owner: { select: { fullName: true } },
        createdAt: true,
      },
    }),
    getPlatformSettings(),
  ]);

  const totalRevenue = revenueAgg._sum.totalAmount ?? 0;
  const totalPlatformFee = revenueAgg._sum.platformFee ?? 0;
  const totalPayouts = revenueAgg._sum.ownerPayout ?? 0;
  const commissionPercent = Math.round(settings.commissionRate * 1000) / 10;
  const totalPending = pendingOwners + pendingListings;

  return (
    <section className="rounded-[2rem] bg-[linear-gradient(180deg,#faf8ff_0%,#eaedff_100%)] px-5 py-6 shadow-[0_8px_40px_rgb(19_27_46_/_0.06)] sm:px-7 sm:py-7">
      <div className="space-y-10">
        <div className="max-w-3xl">
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl xl:text-[2.5rem] xl:leading-tight">
            Performance Overview
          </h1>
          <p className="mt-2 text-base font-medium text-on-surface-variant sm:text-lg">
            Real-time pulse of your car-sharing ecosystem.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]">
          <StatCard
            footnote={`${verifiedOwners} verified`}
            icon={<TrendingUp className="size-4" />}
            label="Total Owners"
            tone="positive"
            value={String(totalOwners)}
          />
          <StatCard
            footnote="All ACTIVE listings"
            icon={<BadgeCheck className="size-4" />}
            label="Active Listings"
            tone="neutral"
            value={String(activeListings)}
          />

          <article className="flex min-h-[10rem] flex-col justify-between rounded-xl bg-[linear-gradient(135deg,#003d9b_0%,#0052cc_100%)] px-7 py-6 text-on-primary shadow-[0_8px_40px_rgb(19_27_46_/_0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-primary/80">
                  Total Revenue
                </p>
                <h2 className="mt-3 font-headline text-[2.75rem] font-extrabold leading-none tracking-tight">
                  {peso.format(totalRevenue)}
                </h2>
                <p className="mt-1 text-xs text-on-primary/70">All-time from completed rentals</p>
              </div>
              <div className="grid size-[3.25rem] place-items-center rounded-xl bg-white/16">
                <Banknote className="size-7" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-on-primary/85">
              <div>
                <p className="text-sm">Platform Fee ({commissionPercent}%)</p>
                <p className="mt-1 text-[2rem] font-semibold text-on-primary">
                  {peso.format(totalPlatformFee)}
                </p>
              </div>
              <div className="hidden h-11 w-0.5 rounded-full bg-white/25 sm:block" />
              <div>
                <p className="text-sm">Owner Payouts</p>
                <p className="mt-1 text-[2rem] font-semibold text-on-primary">
                  {peso.format(totalPayouts)}
                </p>
              </div>
            </div>
          </article>

          <StatCard
            footnote={`${pendingOwners} owners · ${pendingListings} listings`}
            icon={<AlertTriangle className="size-4" />}
            label="Pending Approvals"
            tone={totalPending > 0 ? "danger" : "neutral"}
            value={String(totalPending)}
          />
        </div>

        <div className="grid gap-5 2xl:grid-cols-[22rem_minmax(0,1fr)]">
          <section className="rounded-xl bg-surface-container p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="font-headline text-[1.75rem] font-bold tracking-tight text-on-surface">
                Verification Queue
              </h2>
              <Link
                className="text-sm font-semibold uppercase tracking-wide text-primary"
                href="/owners?status=pending"
              >
                View All
              </Link>
            </div>

            {pendingOwnerQueue.length === 0 && pendingListingQueue.length === 0 ? (
              <p className="rounded-xl bg-surface-container-lowest p-5 text-sm text-on-surface-variant">
                All clear — no pending verifications.
              </p>
            ) : (
              <div className="space-y-4">
                {pendingOwnerQueue.map((owner) => (
                  <QueueCard
                    description="Awaiting host verification"
                    href={`/owners/${owner.id}`}
                    icon={<Users className="size-6" />}
                    key={`owner-${owner.id}`}
                    title={owner.fullName || owner.email}
                  />
                ))}
                {pendingListingQueue.map((listing) => (
                  <QueueCard
                    description={`${listing.owner.fullName} · plate ${listing.plateNumber}`}
                    href={`/car-listings/${listing.id}`}
                    icon={<Car className="size-6" />}
                    key={`listing-${listing.id}`}
                    title={`${listing.brand} ${listing.model}`}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)] sm:p-8">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="font-headline text-[1.75rem] font-bold tracking-tight text-on-surface">
                  Active & Upcoming Bookings
                </h2>
                <p className="text-[1.02rem] text-on-surface-variant">
                  Currently rented vehicles + confirmed bookings awaiting pickup.
                </p>
              </div>
              <Link
                className="inline-flex w-fit items-center gap-1 rounded-full bg-surface-container-highest px-4 py-2 text-sm font-semibold text-on-surface"
                href="/bookings"
              >
                <ClipboardList className="size-4" />
                All bookings
              </Link>
            </div>

            {activeBookings.length === 0 ? (
              <p className="rounded-xl bg-surface-container-low p-6 text-center text-sm text-on-surface-variant">
                No active or upcoming bookings right now.
              </p>
            ) : (
              <div className="hidden overflow-hidden md:block">
                <table className="w-full border-separate border-spacing-y-3 text-left">
                  <thead>
                    <tr className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                      <th className="pb-3 font-semibold">Vehicle</th>
                      <th className="pb-3 font-semibold">Owner / Renter</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Duration</th>
                      <th className="pb-3 text-right font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBookings.map((booking, index) => {
                      const photoUrl = booking.carPhoto
                        ? resolveListingPhotoUrl(booking.carPhoto)
                        : null;
                      return (
                        <tr
                          className={cn(
                            "align-middle transition",
                            index % 2 === 0 ? "bg-surface" : "bg-surface-container-low",
                          )}
                          key={booking.id}
                        >
                          <td className="rounded-l-xl py-5 pl-4 pr-4">
                            <Link className="flex items-center gap-4 hover:opacity-90" href={`/bookings/${booking.id}`}>
                              <div className="relative size-12 overflow-hidden rounded-xl bg-surface-container-high">
                                {photoUrl ? (
                                  <Image
                                    alt={booking.carName}
                                    className="object-cover"
                                    fill
                                    sizes="48px"
                                    src={photoUrl}
                                  />
                                ) : (
                                  <div className="grid size-full place-items-center text-on-surface-variant">
                                    <Car className="size-4" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <h3 className="text-[1.05rem] font-semibold text-on-surface">
                                  {booking.carName}
                                </h3>
                                <p className="font-mono text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                                  {booking.plateNumber}
                                </p>
                              </div>
                            </Link>
                          </td>
                          <td className="py-5 pr-4">
                            <p className="text-[1.02rem] text-on-surface">{booking.ownerName}</p>
                            <p className="text-sm text-on-surface-variant">to {booking.customerName}</p>
                          </td>
                          <td className="py-5 pr-4">
                            <span
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                                bookingStatusStyles[booking.status] ?? "bg-muted text-muted-foreground",
                              )}
                            >
                              {booking.status}
                            </span>
                          </td>
                          <td className="py-5 pr-4 text-xs text-on-surface-variant">
                            {format(booking.pickupDate, "MMM d")} →{" "}
                            {format(booking.returnDate, "MMM d, yyyy")}
                          </td>
                          <td className="rounded-r-xl py-5 pr-4 text-right text-[1.05rem] font-semibold text-primary">
                            {peso.format(booking.totalAmount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="space-y-3 md:hidden">
              {activeBookings.map((booking) => {
                const photoUrl = booking.carPhoto
                  ? resolveListingPhotoUrl(booking.carPhoto)
                  : null;
                return (
                  <Link
                    className="flex items-center gap-3 rounded-xl bg-surface p-3 shadow-[0_6px_20px_rgb(19_27_46_/_0.05)]"
                    href={`/bookings/${booking.id}`}
                    key={booking.id}
                  >
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-surface-container-high">
                      {photoUrl ? (
                        <Image
                          alt={booking.carName}
                          className="object-cover"
                          fill
                          sizes="56px"
                          src={photoUrl}
                        />
                      ) : (
                        <div className="grid size-full place-items-center text-on-surface-variant">
                          <Car className="size-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-base font-semibold text-on-surface">
                          {booking.carName}
                        </h3>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                            bookingStatusStyles[booking.status] ?? "bg-muted text-muted-foreground",
                          )}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        {booking.ownerName} → {booking.customerName}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {format(booking.pickupDate, "MMM d")} →{" "}
                        {format(booking.returnDate, "MMM d, yyyy")} ·{" "}
                        <span className="font-semibold text-primary">
                          {peso.format(booking.totalAmount)}
                        </span>
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  footnote,
  icon,
  label,
  tone,
  value,
}: {
  footnote: string;
  icon: React.ReactNode;
  label: string;
  tone: "positive" | "neutral" | "danger";
  value: string;
}) {
  const valueColor = tone === "danger" ? "text-error" : "text-on-surface";
  const footnoteColor =
    tone === "danger"
      ? "text-on-error-container"
      : tone === "positive"
        ? "text-on-tertiary-fixed-variant"
        : "text-on-surface-variant";
  return (
    <article className="flex min-h-[10rem] flex-col justify-between rounded-xl bg-surface-container-lowest px-7 py-6 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)]">
      <div>
        <p className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
          {label}
        </p>
        <h2 className={cn("mt-4 font-headline text-[2.5rem] font-extrabold leading-none", valueColor)}>
          {value}
        </h2>
      </div>
      <span className={cn("inline-flex w-fit items-center gap-2 text-base font-semibold", footnoteColor)}>
        {icon}
        {footnote}
      </span>
    </article>
  );
}

function QueueCard({
  description,
  href,
  icon,
  title,
}: {
  description: string;
  href: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <Link
      className="block rounded-xl bg-surface-container-lowest p-5 shadow-[0_8px_28px_rgb(19_27_46_/_0.06)] transition hover:shadow-[0_12px_36px_rgb(19_27_46_/_0.1)]"
      href={href}
    >
      <div className="flex items-start gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary-container text-on-secondary-fixed-variant">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[1.1rem] font-semibold text-on-surface">{title}</h3>
          <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
          <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Review <ChevronRight className="size-3" />
          </p>
        </div>
      </div>
    </Link>
  );
}
