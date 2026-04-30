import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  MapPin,
  MessageCircleMore,
  Settings2,
  ShieldCheck,
  Star,
  Users,
  Zap,
} from "lucide-react";
import ScrollReveal from "@/components/marketing/scroll-reveal";
import { db } from "@/lib/db";
import { BookingStatus, ListingStatus, OwnerStatus } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { resolveListingPhotoUrl } from "@/lib/listing-assets";
import { getUnavailableDates } from "@/lib/availability";
import { getPlatformSettings } from "@/lib/platform-settings-server";
import { vehicleFeatureLabel } from "@/lib/listing-taxonomy";
import { BookingCTA } from "./booking-cta";
import { PhotoGallery } from "./photo-gallery";

export const dynamic = "force-dynamic";

type ListingDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; until?: string }>;
};

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export async function generateMetadata({
  params,
}: ListingDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const car = await db.carListing.findUnique({
    where: { id },
    select: { brand: true, model: true, description: true },
  });

  if (!car) {
    return { title: "Listing Not Found | DriveXP" };
  }

  return {
    title: `${car.brand} ${car.model} | DriveXP Listing Details`,
    description: car.description ?? `View details and reserve the ${car.brand} ${car.model}.`,
  };
}

function getFeatureSummary(status: string) {
  if (status === ListingStatus.BOOKED) return "Currently in high demand";
  if (status === ListingStatus.PENDING_APPROVAL) return "Verification in progress";
  return "Ready for your next drive";
}

function getLocationLabel(location: string) {
  return `${location}, Metro Manila`;
}

function getOwnerInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default async function ListingDetailPage({
  params,
  searchParams,
}: ListingDetailPageProps) {
  const { id } = await params;
  const { from: fromParam, until: untilParam } = await searchParams;

  const listing = await db.carListing.findUnique({
    where: { id },
    include: {
      owner: true,
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
  });

  if (!listing) {
    notFound();
  }

  // Auth awareness for the Reserve CTA. We show the booking form for logged-in
  // customers, a "log in to book" link for guests, and a disabled note if the
  // listing itself isn't ACTIVE.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let viewerKind: "guest" | "customer" | "other" = "guest";
  if (user?.email) {
    const customer = await db.customer.findUnique({
      where: { email: user.email },
      select: { id: true },
    });
    viewerKind = customer ? "customer" : "other";
  }

  const unavailableDates = getUnavailableDates({
    horizonDays: 90,
    rules: listing.availabilityRules,
    exceptions: listing.exceptions,
    existingBookings: listing.bookings,
  });

  const settings = await getPlatformSettings();

  const primaryPhoto = listing.photos[0] ?? null;
  const primaryPhotoUrl = primaryPhoto ? resolveListingPhotoUrl(primaryPhoto) : null;
  const galleryPhotos = listing.photos.map((path) => ({
    url: resolveListingPhotoUrl(path),
  }));
  const isVerifiedOwner = listing.owner.status === OwnerStatus.VERIFIED;
  const locationLabel = getLocationLabel(listing.location);

  // Resolve feature slugs to displayable labels in the order they're stored.
  // Unknown slugs (e.g. legacy data) are passed through as raw text.
  const featureLabels = listing.features.map((slug) => ({
    slug,
    label: vehicleFeatureLabel(slug),
  }));
  const featureCount = featureLabels.length;

  // Host trip count: number of past + present bookings on any of this owner's cars.
  const hostTrips = await db.booking.count({ where: { ownerId: listing.owner.id } });

  const nextBooking = listing.bookings
    .slice()
    .sort((a, b) => a.pickupDate.getTime() - b.pickupDate.getTime())[0];

  return (
    <div className="min-h-screen bg-surface pb-32 font-sans text-on-surface antialiased">
      <header className="fixed inset-x-0 top-0 z-40 bg-[rgb(250_248_255_/_0.72)] shadow-[0_8px_30px_rgb(19_27_46_/_0.06)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            aria-label="Back to listings"
            className="grid size-10 place-items-center rounded-full text-on-surface transition hover:bg-surface-container-highest"
            href="/listings"
          >
            <ArrowLeft className="size-5" />
          </Link>

          <Image
            alt="DriveXP"
            className="h-7 w-auto"
            height={28}
            priority
            src="/driveXP-logo-wordmark.png"
            width={113}
          />

          <div className="flex items-center gap-2">
            <button
              aria-label="Notifications"
              className="grid size-10 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-container-highest hover:text-primary"
              type="button"
            >
              <Bell className="size-5" />
            </button>
            <button
              aria-label="Messages"
              className="grid size-10 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-container-highest hover:text-primary"
              type="button"
            >
              <MessageCircleMore className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl pt-16">
        <section className="relative h-[25rem] overflow-hidden bg-surface-container sm:mx-6 sm:mt-6 sm:rounded-[2rem]">
          {primaryPhotoUrl ? (
            <Image
              alt={`${listing.brand} ${listing.model}`}
              className="object-cover"
              fill
              priority
              sizes="100vw"
              src={primaryPhotoUrl}
            />
          ) : (
            <div className="grid size-full place-items-center text-on-surface-variant">
              <span className="text-sm font-medium">Photo coming soon</span>
            </div>
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_12%,rgb(19_27_46_/_0.12)_48%,rgb(19_27_46_/_0.68)_100%)]" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-tertiary-fixed px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-on-tertiary-fixed-variant shadow-[0_10px_24px_rgb(19_27_46_/_0.08)]">
              <ShieldCheck className="size-4" />
              {isVerifiedOwner ? "Premium Verified" : "Curated Listing"}
            </div>
            <h1 className="mt-3 font-headline text-3xl font-extrabold uppercase leading-none tracking-tight text-white sm:text-4xl">
              {listing.brand} {listing.model}
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-white/82 sm:text-base">
              {getFeatureSummary(listing.status)}
            </p>
          </div>
        </section>

        <div className="relative z-10 mx-auto max-w-3xl px-4 pb-10 -mt-4 sm:px-6">
          <ScrollReveal>
            <div className="mb-6 flex items-center justify-between gap-4 rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-[0_14px_36px_rgb(19_27_46_/_0.06)] sm:p-6">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                  Daily Rate
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline text-4xl font-extrabold text-primary">
                    {peso.format(listing.dailyPrice)}
                  </span>
                  <span className="text-sm font-medium text-on-surface-variant">/day</span>
                </div>
              </div>

              <div className="rounded-[1rem] bg-surface-container px-4 py-3 text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-outline">
                  License Plate
                </p>
                <p className="font-headline text-lg font-bold text-on-surface">
                  {listing.plateNumber}
                </p>
              </div>
            </div>
          </ScrollReveal>

          {galleryPhotos.length > 1 ? (
            <ScrollReveal delay={40}>
              <section className="mb-8">
                <h2 className="mb-3 font-headline text-base font-bold text-on-surface">
                  Photos ({galleryPhotos.length})
                </h2>
                <PhotoGallery alt={`${listing.brand} ${listing.model}`} photos={galleryPhotos} />
              </section>
            </ScrollReveal>
          ) : null}

          <ScrollReveal delay={60}>
            <div className="mb-8 grid grid-cols-3 gap-3">
              <div className="rounded-[1.25rem] bg-surface-container-low p-4 text-center shadow-[0_8px_24px_rgb(19_27_46_/_0.04)]">
                <Users className="mx-auto mb-2 size-5 text-primary" />
                <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-on-surface-variant">
                  Seats
                </span>
                <span className="mt-1 block text-sm font-bold text-on-surface">
                  {listing.seatingCapacity} Adults
                </span>
              </div>
              <div className="rounded-[1.25rem] bg-surface-container-low p-4 text-center shadow-[0_8px_24px_rgb(19_27_46_/_0.04)]">
                <Settings2 className="mx-auto mb-2 size-5 text-primary" />
                <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-on-surface-variant">
                  Trans
                </span>
                <span className="mt-1 block text-sm font-bold text-on-surface">
                  {listing.transmission}
                </span>
              </div>
              <div className="rounded-[1.25rem] bg-surface-container-low p-4 text-center shadow-[0_8px_24px_rgb(19_27_46_/_0.04)]">
                <Zap className="mx-auto mb-2 size-5 text-primary" />
                <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-on-surface-variant">
                  Fuel
                </span>
                <span className="mt-1 block text-sm font-bold text-on-surface">
                  {listing.fuelType}
                </span>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={110}>
            <section className="mb-8">
              <h2 className="font-headline text-xl font-bold text-on-surface">
                About this {listing.brand}
              </h2>
              <p className="mt-3 text-sm leading-7 text-on-surface-variant sm:text-[0.95rem]">
                {listing.description ??
                  `Experience curated comfort, reliable performance, and a vehicle prepared with premium care for every trip.`}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-surface-container px-4 py-2 text-xs font-semibold text-on-surface-variant">
                <CalendarDays className="size-4 text-primary" />
                {nextBooking
                  ? `Next trip starts ${format(nextBooking.pickupDate, "MMM d, yyyy")}`
                  : listing.availabilitySummary || "Flexible host-managed schedule"}
              </div>
            </section>
          </ScrollReveal>

          {featureCount > 0 ? (
            <ScrollReveal delay={130}>
              <section className="mb-8">
                <h2 className="mb-4 font-headline text-xl font-bold text-on-surface">
                  Vehicle Features
                </h2>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {featureLabels.map((f) => (
                    <li
                      className="flex items-center gap-2 rounded-md bg-surface-container px-3 py-2 text-sm text-on-surface"
                      key={f.slug}
                    >
                      <span aria-hidden className="text-primary">✓</span>
                      <span>{f.label}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </ScrollReveal>
          ) : null}

          <ScrollReveal delay={150}>
            <section className="mb-8 rounded-[1.5rem] bg-surface-container p-5 shadow-[0_10px_28px_rgb(19_27_46_/_0.04)]">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="grid size-14 place-items-center rounded-full bg-[linear-gradient(135deg,var(--color-primary-fixed)_0%,var(--color-secondary-container)_100%)] text-base font-bold text-primary shadow-[0_8px_24px_rgb(19_27_46_/_0.06)]">
                    {getOwnerInitials(listing.owner.fullName)}
                  </div>
                  {isVerifiedOwner ? (
                    <div className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-tertiary text-white ring-2 ring-surface-container">
                      <ShieldCheck className="size-3" />
                    </div>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Owner
                  </p>
                  <Link
                    className="truncate text-base font-bold text-on-surface hover:text-primary"
                    href={`/hosts/${listing.owner.id}`}
                  >
                    <h3 className="truncate">{listing.owner.fullName}</h3>
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="size-4 fill-current" />
                      <span className="text-xs font-bold text-on-surface">4.8</span>
                    </div>
                    <span className="text-outline">·</span>
                    <span className="text-xs text-on-surface-variant">
                      {hostTrips} trips
                    </span>
                    <span className="text-outline">·</span>
                    <Link
                      className="text-xs font-semibold text-primary hover:underline"
                      href={`/hosts/${listing.owner.id}`}
                    >
                      View profile
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={190}>
            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <h2 className="font-headline text-xl font-bold text-on-surface">
                  Pickup Location
                </h2>
                <span className="text-sm font-semibold text-primary">{locationLabel}</span>
              </div>

              <div className="relative h-52 overflow-hidden rounded-[1.5rem] bg-[linear-gradient(135deg,var(--color-surface-container-high)_0%,var(--color-surface-container)_100%)] shadow-[0_10px_28px_rgb(19_27_46_/_0.04)]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid size-12 place-items-center rounded-full bg-primary/18 animate-pulse">
                    <div className="grid size-5 place-items-center rounded-full bg-primary ring-4 ring-white/90">
                      <MapPin className="size-3 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>
        </div>
      </main>

      <BookingCTA
        commissionRate={settings.commissionRate}
        dailyPrice={listing.dailyPrice}
        initialFromIso={fromParam}
        initialUntilIso={untilParam}
        listingId={listing.id}
        listingStatus={listing.status}
        unavailableDates={unavailableDates.map((d) => d.toISOString())}
        viewerKind={viewerKind}
      />
    </div>
  );
}
