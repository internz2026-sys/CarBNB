import { UserProfileDropdown } from "@/components/user-profile-dropdown";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  CircleDollarSign,
  Headphones,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import ScrollReveal from "@/components/marketing/scroll-reveal";
import { bookings, carListings, customers, owners } from "@/lib/data/mock-data";
import { BookingStatus, OwnerStatus } from "@/types";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const compactPeso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  notation: "compact",
  maximumFractionDigits: 1,
});

const verifiedOwners = owners.filter((owner) => owner.status === OwnerStatus.VERIFIED).length;
const activeTrips = bookings.filter((booking) =>
  [BookingStatus.COMPLETED, BookingStatus.CONFIRMED, BookingStatus.ONGOING].includes(
    booking.status
  )
).length;
const cityCoverage = new Set(carListings.map((car) => car.location)).size;
const totalHostEarnings = owners.reduce((sum, owner) => sum + owner.totalEarnings, 0);

const featuredCars = [
  {
    ...carListings[1],
    rating: 4.9,
    eyebrow: "Family Favorite",
    highlight: "Spacious SUV for weekend escapes",
  },
  {
    ...carListings[2],
    rating: 4.8,
    eyebrow: "Trending Now",
    highlight: "Confident diesel power with premium comfort",
  },
  {
    ...carListings[0],
    rating: 4.9,
    eyebrow: "City Essential",
    highlight: "Efficient and polished for urban trips",
  },
];

const renterSteps = [
  {
    title: "Locate",
    description: "Browse curated cars nearby or at your destination with clear pricing up front.",
  },
  {
    title: "Book",
    description: "Reserve instantly with verified hosts and transparent protection on every trip.",
  },
  {
    title: "Drive",
    description: "Pick up, unlock the journey, and stay supported from departure to return.",
  },
];

const ownerSteps = [
  {
    title: "List",
    description: "Upload your car, set your schedule, and present it with an editorial-quality profile.",
  },
  {
    title: "Verify",
    description: "We screen renters, confirm documents, and keep the marketplace high-trust by design.",
  },
  {
    title: "Earn",
    description: "Track bookings, manage availability, and receive secure payouts without the manual overhead.",
  },
];

const advantages = [
  {
    icon: ShieldCheck,
    title: "Comprehensive Protection",
    description: "Every trip is backed by coverage-first operations and trusted trip support.",
  },
  {
    icon: BadgeCheck,
    title: "Verified Community",
    description: "Hosts, renters, and listings move through a review flow designed for confidence.",
  },
  {
    icon: CircleDollarSign,
    title: "Fast, Visible Payouts",
    description: "Owners keep clear visibility into fees, payouts, and revenue from one platform.",
  },
  {
    icon: Headphones,
    title: "Human Support",
    description: "Questions, claims, and edge cases get handled with real support when timing matters.",
  },
];

const testimonials = [
  {
    quote:
      "carBNB made hosting feel premium instead of stressful. I can finally treat my Fortuner like an asset, not just a parked expense.",
    name: owners[0].fullName,
    role: "Host in Makati City",
  },
  {
    quote:
      "The trip flow feels clean from discovery to pickup. No hidden surprises, and I knew exactly who I was booking with.",
    name: customers[1].fullName,
    role: "Renter from Pasig City",
  },
];



function initialsFor(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed">
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full bg-surface/70 px-4 py-3 shadow-[0_10px_30px_rgb(19_27_46_/_0.08)] backdrop-blur-xl sm:px-6">
          <Link className="flex items-center gap-3" href="/">
            <div className="grid size-10 place-items-center rounded-full bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] text-on-primary shadow-[0_10px_26px_rgb(0_82_204_/_0.24)]">
              <CarFront className="size-5" />
            </div>
            <div>
              <div className="font-headline text-lg font-extrabold tracking-tight text-primary">
                carBNB
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                Premium Car Sharing
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              className="text-sm font-semibold text-primary transition hover:text-primary-container"
              href="#featured-listings"
            >
              Browse Cars
            </Link>
            <Link
              className="text-sm font-medium text-on-surface-variant transition hover:text-primary"
              href="#how-it-works"
            >
              How It Works
            </Link>
            <Link
              className="text-sm font-medium text-on-surface-variant transition hover:text-primary"
              href="#advantage"
            >
              Trust & Safety
            </Link>
          </nav>

          <UserProfileDropdown
            name="Jamie Cruz"
            role="Customer"
            imageUrl="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
            onLogoutHref="/login"
          />
        </div>
      </header>

      <main className="overflow-x-clip pt-28">
        <section className="relative px-6 py-14 sm:py-18 lg:py-24">
          <div className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_top_left,var(--color-primary-fixed)_0%,transparent_44%),radial-gradient(circle_at_80%_12%,rgb(111_251_190_/_0.22),transparent_26%),linear-gradient(180deg,var(--color-surface)_0%,var(--color-surface-container-low)_100%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <ScrollReveal from="left">
              <div className="max-w-2xl">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-primary shadow-[0_10px_28px_rgb(19_27_46_/_0.06)]">
                  <Sparkles className="size-4" />
                  The Curated Engine for road-ready experiences
                </div>
                <h1 className="font-headline text-5xl font-extrabold leading-[0.98] tracking-tight text-on-surface sm:text-6xl xl:text-7xl">
                  Rent a car or turn your idle vehicle into{" "}
                  <span className="text-primary-container">curated income</span>.
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-8 text-on-surface-variant sm:text-xl">
                  carBNB brings verified hosts, confident renters, and premium operations
                  together in one peer-to-peer marketplace built for modern city travel.
                </p>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <Link
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] px-8 py-4 text-lg font-bold text-on-primary shadow-[0_18px_40px_rgb(0_82_204_/_0.22)] transition hover:opacity-95"
                    href="#featured-listings"
                  >
                    Browse Cars
                    <ArrowRight className="size-5" />
                  </Link>
                  <Link
                    className="inline-flex items-center justify-center rounded-full bg-surface-container-highest px-8 py-4 text-lg font-bold text-primary transition hover:bg-surface-variant"
                    href="#owner-journey"
                  >
                    Become a Host
                  </Link>
                </div>

                <div className="mt-10 flex flex-wrap gap-3">
                  {["Verified hosts", "Transparent payouts", "Support-led trips"].map(
                    (item, index) => (
                      <ScrollReveal key={item} className="inline-block" delay={140 + index * 80}>
                        <div className="rounded-full bg-surface-container-lowest px-4 py-2 text-sm font-medium text-on-surface-variant shadow-[0_8px_24px_rgb(19_27_46_/_0.06)]">
                          {item}
                        </div>
                      </ScrollReveal>
                    )
                  )}
                </div>

                <div className="mt-12 grid gap-4 sm:grid-cols-3">
                  {[
                    { value: `${verifiedOwners}+`, label: "Verified hosts" },
                    { value: `${activeTrips}`, label: "Trips in motion" },
                    { value: `${cityCoverage}`, label: "Metro hubs" },
                  ].map((stat, index) => (
                    <ScrollReveal key={stat.label} delay={180 + index * 90}>
                      <div className="rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-[0_12px_32px_rgb(19_27_46_/_0.06)]">
                        <div className="font-headline text-3xl font-extrabold text-on-surface">
                          {stat.value}
                        </div>
                        <div className="mt-2 text-sm font-medium text-on-surface-variant">
                          {stat.label}
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={120} from="right">
              <div className="relative">
                <div className="absolute -left-6 top-14 h-40 w-40 rounded-full bg-primary/12 blur-3xl" />
                <div className="absolute -right-8 bottom-4 h-44 w-44 rounded-full bg-tertiary-fixed/30 blur-3xl" />
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="relative min-h-[26rem] overflow-hidden rounded-[2.4rem] bg-surface-container-highest shadow-[0_18px_50px_rgb(19_27_46_/_0.08)]">
                    <Image
                      alt={`${featuredCars[0].brand} ${featuredCars[0].model}`}
                      className="object-cover"
                      fill
                      priority
                      sizes="(min-width: 1024px) 34vw, 100vw"
                      src={featuredCars[0].photos[0]}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_24%,rgb(19_27_46_/_0.68)_100%)]" />
                    <div className="absolute left-6 top-6 rounded-full bg-surface/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-primary backdrop-blur-md">
                      Featured Host Drive
                    </div>
                    <div className="absolute inset-x-6 bottom-6">
                      <div className="inline-flex items-center gap-2 rounded-full bg-tertiary-fixed px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-on-tertiary-fixed-variant">
                        <BadgeCheck className="size-4" />
                        Fully Verified
                      </div>
                      <div className="mt-4 font-headline text-3xl font-black text-white">
                        {featuredCars[0].brand} {featuredCars[0].model}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/82">
                        <span>{featuredCars[0].year}</span>
                        <span>{featuredCars[0].transmission}</span>
                        <span>{featuredCars[0].seatingCapacity} seats</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="rounded-[2rem] bg-surface-container-lowest p-6 shadow-[0_12px_32px_rgb(19_27_46_/_0.06)]">
                      <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-outline">
                        Host earnings
                      </div>
                      <div className="mt-3 font-headline text-4xl font-black text-on-surface">
                        {compactPeso.format(totalHostEarnings)}
                      </div>
                      <div className="mt-3 text-sm leading-6 text-on-surface-variant">
                        Generated by active hosts already operating inside the marketplace.
                      </div>
                    </div>

                    <div className="relative min-h-[14rem] overflow-hidden rounded-[2rem] bg-surface-container shadow-[0_12px_32px_rgb(19_27_46_/_0.06)]">
                      <Image
                        alt={`${featuredCars[1].brand} ${featuredCars[1].model}`}
                        className="object-cover"
                        fill
                        sizes="(min-width: 1024px) 20vw, 100vw"
                        src={featuredCars[1].photos[0]}
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgb(19_27_46_/_0.7)_100%)]" />
                      <div className="absolute inset-x-5 bottom-5">
                        <div className="text-sm font-semibold text-white/82">
                          {featuredCars[1].highlight}
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-white">
                          <Star className="size-4 fill-current text-amber-400" />
                          <span className="text-sm font-bold">
                            {featuredCars[1].rating.toFixed(1)} guest rating
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>



        <section className="scroll-mt-28 px-6 py-24" id="how-it-works">
          <div className="mx-auto max-w-7xl">
            <ScrollReveal>
              <div className="mx-auto max-w-3xl text-center">
                <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
                  How It Works
                </div>
                <h2 className="mt-4 font-headline text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl">
                  Sharing built with hospitality, not friction
                </h2>
                <p className="mt-5 text-lg leading-8 text-on-surface-variant">
                  Choose your path in the carBNB ecosystem, whether you want a polished
                  drive for the weekend or a better return on a parked asset.
                </p>
              </div>
            </ScrollReveal>

            <div className="mt-14 grid gap-8 lg:grid-cols-2">
              <ScrollReveal>
                <div className="rounded-[2.4rem] bg-surface-container-lowest p-8 shadow-[0_16px_40px_rgb(19_27_46_/_0.06)] sm:p-10">
                  <div className="inline-flex rounded-full bg-primary-fixed px-4 py-2 text-sm font-bold text-on-primary-fixed-variant">
                    For Renters
                  </div>
                  <h3 className="mt-7 font-headline text-3xl font-black text-on-surface">
                    Find your next journey
                  </h3>
                  <div className="mt-10 space-y-8">
                    {renterSteps.map((step, index) => (
                      <div key={step.title} className="flex gap-5">
                        <div className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-container-high text-base font-bold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-lg font-bold text-on-surface">{step.title}</div>
                          <div className="mt-2 max-w-md text-sm leading-7 text-on-surface-variant">
                            {step.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={80}>
                <div
                  className="rounded-[2.4rem] bg-[linear-gradient(180deg,rgb(213_227_252_/_0.55)_0%,rgb(234_237_255)_100%)] p-8 shadow-[0_16px_40px_rgb(19_27_46_/_0.06)] sm:p-10"
                  id="owner-journey"
                >
                  <div className="inline-flex rounded-full bg-tertiary-fixed px-4 py-2 text-sm font-bold text-on-tertiary-fixed-variant">
                    For Owners
                  </div>
                  <h3 className="mt-7 font-headline text-3xl font-black text-on-surface">
                    Turn your car into an asset
                  </h3>
                  <div className="mt-10 space-y-8">
                    {ownerSteps.map((step, index) => (
                      <div key={step.title} className="flex gap-5">
                        <div className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-container-lowest text-base font-bold text-tertiary">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-lg font-bold text-on-surface">{step.title}</div>
                          <div className="mt-2 max-w-md text-sm leading-7 text-on-surface-variant">
                            {step.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section className="scroll-mt-28 bg-surface-container-low px-6 py-24" id="featured-listings">
          <div className="mx-auto max-w-7xl">
            <ScrollReveal>
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
                    Featured Listings
                  </div>
                  <h2 className="mt-4 font-headline text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl">
                    Ready for the road
                  </h2>
                  <p className="mt-4 max-w-2xl text-lg leading-8 text-on-surface-variant">
                    A curated set of marketplace vehicles built around trust, presentation,
                    and easy booking flow.
                  </p>
                </div>
                <Link
                  className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-container"
                  href={`/listings/${featuredCars[0].id}`}
                >
                  View featured car
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </ScrollReveal>

            <div className="mt-12 grid gap-8 lg:grid-cols-3">
              {featuredCars.map((car, index) => (
                <ScrollReveal key={car.id} delay={index * 90}>
                  <article className="group overflow-hidden rounded-[2rem] bg-surface-container-lowest shadow-[0_16px_40px_rgb(19_27_46_/_0.06)] transition-transform hover:-translate-y-1">
                    <div className="relative aspect-[16/11] overflow-hidden">
                      <Image
                        alt={`${car.brand} ${car.model}`}
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        fill
                        sizes="(min-width: 1024px) 28vw, (min-width: 640px) 48vw, 100vw"
                        src={car.photos[0]}
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgb(19_27_46_/_0.22)_100%)]" />
                      <div className="absolute left-5 top-5 inline-flex rounded-full bg-tertiary-fixed px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-on-tertiary-fixed-variant">
                        {car.eyebrow}
                      </div>
                    </div>
                    <div className="space-y-6 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-headline text-2xl font-bold text-on-surface">
                            {car.brand} {car.model}
                          </h3>
                          <p className="mt-2 text-sm text-on-surface-variant">{car.highlight}</p>
                        </div>
                        <div className="rounded-full bg-surface-container-highest px-3 py-1.5 text-sm font-bold text-primary">
                          {car.rating.toFixed(1)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {[`${car.year}`, car.transmission, `${car.seatingCapacity} seats`].map(
                          (item) => (
                            <span
                              key={item}
                              className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant"
                            >
                              {item}
                            </span>
                          )
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-on-surface-variant">
                        <div className="flex items-center gap-2">
                          <MapPin className="size-4 text-primary" />
                          {car.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <BadgeCheck className="size-4 text-primary" />
                          Hosted by {car.ownerName}
                        </div>
                      </div>

                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <div className="font-headline text-3xl font-black text-primary">
                            {peso.format(car.dailyPrice)}
                          </div>
                          <div className="text-sm text-on-surface-variant">per day</div>
                        </div>
                        <Link
                          className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] px-5 py-3 text-sm font-bold text-on-primary shadow-[0_12px_24px_rgb(0_82_204_/_0.18)] transition hover:opacity-95"
                          href={`/listings/${car.id}`}
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="scroll-mt-28 px-6 py-24" id="advantage">
          <div className="mx-auto max-w-7xl">
            <ScrollReveal>
              <div className="mx-auto max-w-3xl text-center">
                <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
                  The carBNB Advantage
                </div>
                <h2 className="mt-4 font-headline text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl">
                  High-trust travel without the template feel
                </h2>
                <p className="mt-5 text-lg leading-8 text-on-surface-variant">
                  Protection, operations, and service work together so the marketplace feels
                  premium on both sides of the trip.
                </p>
              </div>
            </ScrollReveal>

            <div className="mt-14 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
              {advantages.map((item, index) => {
                const Icon = item.icon;

                return (
                  <ScrollReveal key={item.title} delay={index * 80}>
                    <div className="rounded-[2rem] bg-surface-container p-8 text-center shadow-[0_14px_34px_rgb(19_27_46_/_0.05)]">
                      <div className="mx-auto grid size-16 place-items-center rounded-[1.35rem] bg-primary/10 text-primary">
                        <Icon className="size-7" />
                      </div>
                      <h3 className="mt-6 text-xl font-bold text-on-surface">{item.title}</h3>
                      <p className="mt-4 text-sm leading-7 text-on-surface-variant">
                        {item.description}
                      </p>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <ScrollReveal from="left">
              <div className="rounded-[2.4rem] bg-surface-container-low p-10 shadow-[0_16px_40px_rgb(19_27_46_/_0.05)]">
                <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
                  Community Signal
                </div>
                <h2 className="mt-5 font-headline text-4xl font-extrabold tracking-tight text-on-surface">
                  What people remember after the trip
                </h2>
                <div className="mt-8 flex gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="size-5 fill-current" />
                  ))}
                </div>
                <p className="mt-6 text-lg leading-8 text-on-surface-variant">
                  Hosts gain more control over their vehicle earnings while renters get a
                  cleaner, more human booking experience.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-8 md:grid-cols-2">
              {testimonials.map((testimonial, index) => (
                <ScrollReveal key={testimonial.name} delay={index * 90}>
                  <div className="rounded-[2.2rem] bg-surface-container-lowest p-8 shadow-[0_16px_40px_rgb(19_27_46_/_0.06)]">
                    <p className="text-lg leading-8 text-on-surface">
                      &quot;{testimonial.quote}&quot;
                    </p>
                    <div className="mt-8 flex items-center gap-4">
                      <div className="grid size-12 place-items-center rounded-full bg-surface-container-highest text-sm font-bold text-primary">
                        {initialsFor(testimonial.name)}
                      </div>
                      <div>
                        <div className="font-bold text-on-surface">{testimonial.name}</div>
                        <div className="text-sm text-on-surface-variant">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 pt-6">
          <div className="mx-auto max-w-5xl">
            <ScrollReveal>
              <div className="relative overflow-hidden rounded-[3rem] bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] px-8 py-14 text-center text-on-primary shadow-[0_24px_60px_rgb(0_82_204_/_0.24)] sm:px-12 sm:py-20">
                <div className="absolute -right-24 -top-24 size-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 size-64 rounded-full bg-white/10 blur-3xl" />
                <div className="relative z-10">
                  <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/72">
                    Join the community
                  </div>
                  <h2 className="mt-5 font-headline text-4xl font-black tracking-tight sm:text-6xl">
                    Start with a drive, stay for the ecosystem
                  </h2>
                  <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/82 sm:text-xl">
                    Whether you want your dream weekend car or a stronger return from your
                    vehicle, carBNB gives you a calmer way to move.
                  </p>
                  <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link
                      className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-lg font-bold text-primary transition hover:bg-slate-50"
                      href="/login"
                    >
                      Start Renting
                    </Link>
                    <Link
                      className="inline-flex items-center justify-center rounded-full bg-white/10 px-8 py-4 text-lg font-bold text-white transition hover:bg-white/16"
                      href="#owner-journey"
                    >
                      Become an Owner
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <footer className="bg-surface-container-low px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <ScrollReveal>
            <div>
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-full bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] text-on-primary">
                  <CarFront className="size-5" />
                </div>
                <div>
                  <div className="font-headline text-xl font-extrabold text-on-surface">
                    carBNB
                  </div>
                  <div className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">
                    Peer-to-peer marketplace
                  </div>
                </div>
              </div>
              <p className="mt-6 max-w-sm text-sm leading-7 text-on-surface-variant">
                Redefining the way people move by connecting trusted hosts with explorers
                through a premium marketplace experience.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={60}>
            <div>
              <h3 className="font-headline text-lg font-bold text-on-surface">Explore</h3>
              <div className="mt-5 space-y-3 text-sm">
                <Link className="block text-on-surface-variant transition hover:text-primary" href="#featured-listings">
                  Browse Cars
                </Link>
                <Link className="block text-on-surface-variant transition hover:text-primary" href="#how-it-works">
                  How It Works
                </Link>
                <Link className="block text-on-surface-variant transition hover:text-primary" href="#advantage">
                  Trust & Safety
                </Link>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <div>
              <h3 className="font-headline text-lg font-bold text-on-surface">Platform</h3>
              <div className="mt-5 space-y-3 text-sm">
                <Link className="block text-on-surface-variant transition hover:text-primary" href="/dashboard">
                  Admin Dashboard
                </Link>
                <Link className="block text-on-surface-variant transition hover:text-primary" href="/login">
                  Sign In
                </Link>
                <Link className="block text-on-surface-variant transition hover:text-primary" href="#owner-journey">
                  Host Journey
                </Link>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={180}>
            <div>
              <h3 className="font-headline text-lg font-bold text-on-surface">Contact</h3>
              <div className="mt-5 space-y-3 text-sm text-on-surface-variant">
                <div>support@carbnb.com</div>
                <div>+63 917 000 0000</div>
                <div>Built for Metro Manila hosts and renters.</div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <div className="mx-auto mt-12 max-w-7xl text-xs text-on-surface-variant">
          Copyright 2026 carBNB Marketplace. Made for the road and the people behind it.
        </div>
      </footer>
    </div>
  );
}
