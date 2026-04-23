import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Car, Plus } from "lucide-react";

import { db } from "@/lib/db";
import { ListingStatus } from "@/types";
import { getCurrentHost } from "@/lib/current-host";
import { resolveListingPhotoUrl } from "@/lib/listing-assets";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const statusBadgeStyles: Record<string, string> = {
  [ListingStatus.ACTIVE]: "bg-emerald-100 text-emerald-700",
  [ListingStatus.PENDING_APPROVAL]: "bg-amber-100 text-amber-700",
  [ListingStatus.BOOKED]: "bg-blue-100 text-blue-700",
  [ListingStatus.SUSPENDED]: "bg-red-100 text-red-700",
  [ListingStatus.REJECTED]: "bg-red-100 text-red-700",
  [ListingStatus.UNAVAILABLE]: "bg-gray-100 text-gray-700",
};

export default async function HostCarsPage() {
  const session = await getCurrentHost();
  if (session.kind !== "verified") redirect("/host/dashboard");

  const cars = await db.carListing.findMany({
    where: { ownerId: session.owner.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      brand: true,
      model: true,
      year: true,
      plateNumber: true,
      location: true,
      dailyPrice: true,
      status: true,
      photos: true,
      availabilitySummary: true,
    },
  });

  return (
    <div className="pb-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
            My Cars
          </h1>
          <p className="mt-2 text-base text-on-surface-variant">
            Vehicles in your fleet. New listings start as pending until admin approves.
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#003d9b_0%,#0052cc_100%)] px-5 py-3 text-sm font-semibold text-on-primary shadow-[0_8px_40px_rgb(19_27_46_/_0.06)] transition hover:opacity-95"
          href="/host/cars/new"
        >
          <Plus className="size-4" />
          Add Listing
        </Link>
      </div>

      {cars.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest p-12 text-center shadow-[0_8px_24px_rgb(19_27_46_/_0.04)]">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-surface-container text-on-surface-variant">
            <Car className="size-7" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-on-surface">No cars yet</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            List your first vehicle to start accepting bookings.
          </p>
          <Link
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
            href="/host/cars/new"
          >
            <Plus className="size-4" />
            Add First Listing
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((car) => {
            const primary = car.photos[0];
            const photoUrl = primary ? resolveListingPhotoUrl(primary) : null;
            return (
              <li key={car.id}>
                <Link
                  className="group flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_8px_24px_rgb(19_27_46_/_0.05)] transition hover:shadow-[0_12px_36px_rgb(19_27_46_/_0.09)]"
                  href={`/host/cars/${car.id}/edit`}
                >
                  <div className="relative aspect-[4/3] w-full bg-surface-container">
                    {photoUrl ? (
                      <Image
                        alt={`${car.brand} ${car.model}`}
                        className="object-cover transition group-hover:scale-[1.02]"
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        src={photoUrl}
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-on-surface-variant">
                        <Car className="size-8" />
                      </div>
                    )}
                    <span
                      className={cn(
                        "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                        statusBadgeStyles[car.status] ?? "bg-gray-100 text-gray-700",
                      )}
                    >
                      {car.status}
                    </span>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-on-surface">
                          {car.brand} {car.model}
                        </h3>
                        <p className="truncate text-xs text-on-surface-variant">
                          {car.year} · {car.location}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-primary">
                        {peso.format(car.dailyPrice)}
                        <span className="ml-0.5 text-[10px] font-semibold uppercase text-on-surface-variant">
                          /day
                        </span>
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                        {car.plateNumber}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        {car.availabilitySummary || "No schedule"}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
