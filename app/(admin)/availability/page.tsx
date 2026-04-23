import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Calendar, CalendarX, ChevronRight, Clock } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { ListingStatus } from "@/types";
import { resolveListingPhotoUrl } from "@/lib/listing-assets";

export const dynamic = "force-dynamic";

export default async function AvailabilityOverviewPage() {
  const now = new Date();
  const twoWeeksOut = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [listings, upcomingExceptions] = await Promise.all([
    db.carListing.findMany({
      where: {
        status: { in: [ListingStatus.ACTIVE, ListingStatus.PENDING_APPROVAL, ListingStatus.BOOKED] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, fullName: true } },
        exceptions: {
          where: { date: { gte: now } },
          orderBy: { date: "asc" },
        },
      },
    }),
    db.carAvailabilityException.findMany({
      where: { date: { gte: now, lte: twoWeeksOut } },
      orderBy: { date: "asc" },
      include: {
        carListing: { select: { id: true, brand: true, model: true, plateNumber: true } },
      },
    }),
  ]);

  const totalListings = listings.length;
  const configured = listings.filter((l) => l.availabilitySummary).length;
  const withUpcomingBlocks = listings.filter(
    (l) => l.exceptions.length > 0 && l.exceptions.some((e) => !e.isAvailable),
  ).length;

  return (
    <section className="rounded-[2rem] bg-[linear-gradient(180deg,#faf8ff_0%,#eaedff_100%)] px-5 py-6 shadow-[0_8px_40px_rgb(19_27_46_/_0.06)] sm:px-7 sm:py-7">
      <div className="space-y-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl xl:text-[2.5rem] xl:leading-tight">
              Fleet Availability
            </h1>
            <p className="mt-2 text-base font-medium text-on-surface-variant sm:text-lg">
              Read-only overview of listing schedules and upcoming blocks. To edit a
              schedule, open the listing&apos;s edit page.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <SummaryCard
            hint={`${totalListings} active + pending`}
            label="Listings in rotation"
            value={totalListings}
          />
          <SummaryCard
            hint={`${configured} configured · ${totalListings - configured} missing`}
            label="Weekly schedule set"
            value={configured}
          />
          <SummaryCard
            hint="Next 14 days"
            label="Upcoming date blocks"
            value={withUpcomingBlocks}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Listing schedules</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {listings.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  No active or pending listings yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {listings.map((listing) => {
                    const primaryPhoto = listing.photos[0];
                    const nextBlocks = listing.exceptions
                      .filter((e) => !e.isAvailable)
                      .slice(0, 3);
                    return (
                      <li className="flex items-center gap-4 p-4" key={listing.id}>
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {primaryPhoto ? (
                            <Image
                              alt={`${listing.brand} ${listing.model}`}
                              className="object-cover"
                              fill
                              src={resolveListingPhotoUrl(primaryPhoto)}
                            />
                          ) : (
                            <div className="grid size-full place-items-center text-muted-foreground">
                              <Calendar className="size-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <Link
                              className="text-sm font-semibold hover:underline"
                              href={`/car-listings/${listing.id}`}
                            >
                              {listing.brand} {listing.model}
                            </Link>
                            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                              {listing.plateNumber}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              · {listing.owner.fullName}
                            </span>
                          </div>
                          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            {listing.availabilitySummary || "Weekly schedule not set"}
                          </p>
                          {nextBlocks.length > 0 ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Blocked:{" "}
                              {nextBlocks
                                .map((b) => format(new Date(b.date), "MMM d"))
                                .join(", ")}
                              {listing.exceptions.filter((e) => !e.isAvailable).length >
                              nextBlocks.length
                                ? " ..."
                                : ""}
                            </p>
                          ) : null}
                        </div>
                        <Link
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "shrink-0",
                          )}
                          href={`/car-listings/${listing.id}/edit`}
                        >
                          Edit
                          <ChevronRight className="size-4 ml-1" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Upcoming blocks (next 14 days)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingExceptions.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  No date blocks or exceptions in the next two weeks.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {upcomingExceptions.map((ex) => (
                    <li className="flex items-start gap-3 p-4" key={ex.id}>
                      <CalendarX
                        className={`size-4 mt-0.5 shrink-0 ${ex.isAvailable ? "text-emerald-600" : "text-red-500"}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {format(new Date(ex.date), "EEEE, MMM d")}
                        </p>
                        <Link
                          className="text-xs text-primary hover:underline"
                          href={`/car-listings/${ex.carListing.id}`}
                        >
                          {ex.carListing.brand} {ex.carListing.model} (
                          {ex.carListing.plateNumber})
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {ex.isAvailable ? "Forced available" : "Blocked"}
                          {ex.reason ? ` · ${ex.reason}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({
  hint,
  label,
  value,
}: {
  hint: string;
  label: string;
  value: number;
}) {
  return (
    <article className="flex min-h-[7.5rem] flex-col justify-between rounded-xl bg-surface-container-lowest px-6 py-5 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)]">
      <div>
        <p className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
          {label}
        </p>
        <h2 className="mt-2 font-headline text-[2rem] font-extrabold leading-none text-on-surface">
          {value}
        </h2>
      </div>
      <p className="text-sm text-on-surface-variant">{hint}</p>
    </article>
  );
}
