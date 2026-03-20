import type { Metadata } from "next";
import { UserProfileDropdown } from "@/components/user-profile-dropdown";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Heart,
  MapPin,
  MessageCircleMore,
  Settings2,
  ShieldCheck,
  Star,
  Users,
  Zap,
} from "lucide-react";
import ScrollReveal from "@/components/marketing/scroll-reveal";
import { bookings, carListings, owners } from "@/lib/data/mock-data";
import { BookingStatus, OwnerStatus } from "@/types";

type ListingDetailPageProps = {
  params: Promise<{ id: string }>;
};

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const ownerRatings: Record<string, number> = {
  "OWN-001": 4.9,
  "OWN-002": 4.8,
  "OWN-003": 4.6,
  "OWN-004": 4.5,
  "OWN-005": 4.7,
};

export async function generateStaticParams() {
  return carListings.map((car) => ({ id: car.id }));
}

export async function generateMetadata({
  params,
}: ListingDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const car = carListings.find((entry) => entry.id === id);

  if (!car) {
    return {
      title: "Listing Not Found | carBNB",
    };
  }

  return {
    title: `${car.brand} ${car.model} | carBNB Listing Details`,
    description: car.description ?? `View details and reserve the ${car.brand} ${car.model}.`,
  };
}

function getFeatureSummary(status: string) {
  if (status === "Booked") {
    return "Currently in high demand";
  }

  if (status === "Pending Approval") {
    return "Verification in progress";
  }

  return "Ready for your next drive";
}

function getLocationLabel(location: string) {
  return `${location}, Metro Manila`;
}

function getHostTrips(ownerId: string) {
  return bookings.filter((booking) => booking.ownerId === ownerId).length;
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
}: ListingDetailPageProps) {
  const { id } = await params;
  const car = carListings.find((entry) => entry.id === id);

  if (!car) {
    notFound();
  }

  const owner = owners.find((entry) => entry.id === car.ownerId) ?? owners[0];
  const ownerRating = ownerRatings[owner.id] ?? 4.8;
  const hostTrips = getHostTrips(owner.id);
  const upcomingBooking = bookings.find(
    (booking) =>
      booking.carListingId === car.id &&
      [BookingStatus.CONFIRMED, BookingStatus.ONGOING, BookingStatus.PENDING].includes(
        booking.status
      )
  );
  const locationLabel = getLocationLabel(car.location);
  const isVerifiedOwner = owner.status === OwnerStatus.VERIFIED;

  return (
    <div className="min-h-screen bg-surface pb-32 font-sans text-on-surface antialiased">
      <header className="fixed inset-x-0 top-0 z-40 bg-[rgb(250_248_255_/_0.72)] shadow-[0_8px_30px_rgb(19_27_46_/_0.06)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            aria-label="Back to listings"
            className="grid size-10 place-items-center rounded-full text-on-surface transition hover:bg-surface-container-highest"
            href="/#featured-listings"
          >
            <ArrowLeft className="size-5" />
          </Link>

          <div className="font-headline text-2xl font-black tracking-tight text-primary">
            carBNB
          </div>

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
            <UserProfileDropdown
              name="Jamie Cruz"
              role="Customer"
              imageUrl="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
              onLogoutHref="/login"
            />

          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl pt-16">
        <section className="relative h-[25rem] overflow-hidden bg-surface-container sm:mx-6 sm:mt-6 sm:rounded-[2rem]">
          <Image
            alt={`${car.brand} ${car.model}`}
            className="object-cover"
            fill
            priority
            sizes="100vw"
            src={car.photos[0]}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_12%,rgb(19_27_46_/_0.12)_48%,rgb(19_27_46_/_0.68)_100%)]" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-tertiary-fixed px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-on-tertiary-fixed-variant shadow-[0_10px_24px_rgb(19_27_46_/_0.08)]">
              <ShieldCheck className="size-4" />
              {isVerifiedOwner ? "Premium Verified" : "Curated Listing"}
            </div>
            <h1 className="mt-3 font-headline text-3xl font-extrabold uppercase leading-none tracking-tight text-white sm:text-4xl">
              {car.brand} {car.model}
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-white/82 sm:text-base">
              {getFeatureSummary(car.status)}
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
                    {peso.format(car.dailyPrice)}
                  </span>
                  <span className="text-sm font-medium text-on-surface-variant">/day</span>
                </div>
              </div>

              <div className="rounded-[1rem] bg-surface-container px-4 py-3 text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-outline">
                  License Plate
                </p>
                <p className="font-headline text-lg font-bold text-on-surface">
                  {car.plateNumber}
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={60}>
            <div className="mb-8 grid grid-cols-3 gap-3">
              <div className="rounded-[1.25rem] bg-surface-container-low p-4 text-center shadow-[0_8px_24px_rgb(19_27_46_/_0.04)]">
                <Users className="mx-auto mb-2 size-5 text-primary" />
                <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-on-surface-variant">
                  Seats
                </span>
                <span className="mt-1 block text-sm font-bold text-on-surface">
                  {car.seatingCapacity} Adults
                </span>
              </div>
              <div className="rounded-[1.25rem] bg-surface-container-low p-4 text-center shadow-[0_8px_24px_rgb(19_27_46_/_0.04)]">
                <Settings2 className="mx-auto mb-2 size-5 text-primary" />
                <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-on-surface-variant">
                  Trans
                </span>
                <span className="mt-1 block text-sm font-bold text-on-surface">
                  {car.transmission}
                </span>
              </div>
              <div className="rounded-[1.25rem] bg-surface-container-low p-4 text-center shadow-[0_8px_24px_rgb(19_27_46_/_0.04)]">
                <Zap className="mx-auto mb-2 size-5 text-primary" />
                <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-on-surface-variant">
                  Fuel
                </span>
                <span className="mt-1 block text-sm font-bold text-on-surface">
                  {car.fuelType}
                </span>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={110}>
            <section className="mb-8">
              <h2 className="font-headline text-xl font-bold text-on-surface">
                About this {car.brand}
              </h2>
              <p className="mt-3 text-sm leading-7 text-on-surface-variant sm:text-[0.95rem]">
                {car.description ??
                  `Experience curated comfort, reliable performance, and a vehicle prepared with premium care for every trip.`}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-surface-container px-4 py-2 text-xs font-semibold text-on-surface-variant">
                <CalendarDays className="size-4 text-primary" />
                {upcomingBooking
                  ? `Next trip starts ${upcomingBooking.pickupDate}`
                  : car.availabilitySummary || "Flexible host-managed schedule"}
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <section className="mb-8 rounded-[1.5rem] bg-surface-container p-5 shadow-[0_10px_28px_rgb(19_27_46_/_0.04)]">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="grid size-14 place-items-center rounded-full bg-[linear-gradient(135deg,var(--color-primary-fixed)_0%,var(--color-secondary-container)_100%)] text-base font-bold text-primary shadow-[0_8px_24px_rgb(19_27_46_/_0.06)]">
                    {getOwnerInitials(owner.fullName)}
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
                  <h3 className="truncate text-base font-bold text-on-surface">
                    {owner.fullName}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="size-4 fill-current" />
                      <span className="text-xs font-bold text-on-surface">
                        {ownerRating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-outline">&middot;</span>
                    <span className="text-xs text-on-surface-variant">
                      {hostTrips} trips
                    </span>
                  </div>
                </div>

                <button
                  aria-label="Message owner"
                  className="grid size-10 place-items-center rounded-full bg-surface-container-highest text-primary transition hover:scale-[1.02]"
                  type="button"
                >
                  <MessageCircleMore className="size-5" />
                </button>
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
                <div className="absolute inset-0 opacity-55 [background-image:linear-gradient(rgb(255_255_255_/_0.45)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255_/_0.45)_1px,transparent_1px)] [background-size:34px_34px]" />
                <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_20%_25%,rgb(0_82_204_/_0.08),transparent_22%),radial-gradient(circle_at_78%_62%,rgb(111_251_190_/_0.16),transparent_20%),linear-gradient(130deg,transparent_0%,rgb(255_255_255_/_0.25)_100%)]" />
                <div className="absolute inset-0">
                  <div className="absolute left-[18%] top-[28%] h-2 w-28 rounded-full bg-white/60" />
                  <div className="absolute left-[40%] top-[18%] h-2 w-24 rounded-full bg-white/50" />
                  <div className="absolute left-[22%] top-[56%] h-2 w-36 rounded-full bg-white/55" />
                  <div className="absolute left-[58%] top-[48%] h-2 w-24 rounded-full bg-white/55" />
                  <div className="absolute left-[64%] top-[72%] h-2 w-20 rounded-full bg-white/45" />
                  <div className="absolute left-[54%] top-[34%] h-20 w-2 rounded-full bg-white/55" />
                  <div className="absolute left-[30%] top-[18%] h-24 w-2 rounded-full bg-white/45" />
                </div>
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

      <div className="fixed inset-x-0 bottom-0 z-50 bg-[rgb(255_255_255_/_0.8)] shadow-[0_-4px_24px_rgb(19_27_46_/_0.08)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-5 sm:px-6">
          <div className="flex-1">
            <Link
              className="flex h-14 w-full items-center justify-center gap-2 rounded-[1rem] bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] px-6 font-headline text-base font-bold text-on-primary shadow-[0_12px_28px_rgb(0_82_204_/_0.2)] transition hover:opacity-95"
              href={`/login?callbackUrl=/listings/${car.id}/book`}
            >
              <CalendarDays className="size-5" />
              Reserve Now
            </Link>
          </div>
          <button
            aria-label="Save listing"
            className="grid size-14 place-items-center rounded-[1rem] bg-surface-container-highest text-primary transition hover:scale-[1.02]"
            type="button"
          >
            <Heart className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
